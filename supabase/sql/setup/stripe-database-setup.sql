-- ================================================================
-- STRIPE INTEGRATION - Tabelas e Colunas para Assinaturas
-- ================================================================

-- 1. Verificar e adicionar colunas necessárias em organizations
-- ================================================================

-- Adicionar coluna 'type' se não existir (usada em algumas queries antigas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'organizations' 
      AND column_name = 'type'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN type TEXT DEFAULT 'standard';
  END IF;
END $$;

-- Adicionar colunas de Stripe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'organizations' 
      AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'organizations' 
      AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'organizations' 
      AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN subscription_status TEXT DEFAULT 'trial';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'organizations' 
      AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN current_period_end TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar constraints UNIQUE (se ainda não existem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_stripe_customer_id_key'
  ) THEN
    ALTER TABLE public.organizations 
    ADD CONSTRAINT organizations_stripe_customer_id_key UNIQUE (stripe_customer_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE public.organizations 
    ADD CONSTRAINT organizations_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN public.organizations.stripe_customer_id IS 'ID do cliente no Stripe (cus_...)';
COMMENT ON COLUMN public.organizations.stripe_subscription_id IS 'ID da assinatura no Stripe (sub_...)';
COMMENT ON COLUMN public.organizations.subscription_status IS 'Status: trial, active, past_due, canceled, unpaid';
COMMENT ON COLUMN public.organizations.current_period_end IS 'Data de término do período atual';

-- 2. Criar tabela de histórico de pagamentos
-- ================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Stripe IDs
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,
  
  -- Detalhes do pagamento
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL, -- succeeded, pending, failed, refunded
  
  -- Metadados
  plan_id TEXT NOT NULL, -- starter, professional, enterprise
  payment_method TEXT, -- card, pix, boleto
  receipt_url TEXT,
  
  -- Datas
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_organization ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);

-- RLS para payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- 3. Criar tabela de eventos de webhook do Stripe
-- ================================================================
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe Event ID
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- customer.subscription.created, invoice.paid, etc
  
  -- Payload
  data JSONB NOT NULL,
  
  -- Processamento
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.stripe_webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON public.stripe_webhook_events(created_at DESC);

-- Sem RLS - apenas para uso interno via service_role

-- 4. Função para verificar trial expirado
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_trial_expired(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_status TEXT;
  trial_end TIMESTAMPTZ;
BEGIN
  SELECT status, trial_ends_at
  INTO org_status, trial_end
  FROM public.organizations
  WHERE id = org_id;
  
  -- Se não está em trial, não expirou
  IF org_status != 'trial' THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica se trial expirou
  RETURN trial_end < NOW();
END;
$$;

-- 5. Função para atualizar status de assinatura
-- ================================================================
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  p_organization_id UUID,
  p_stripe_subscription_id TEXT,
  p_status TEXT,
  p_current_period_end TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.organizations
  SET 
    stripe_subscription_id = p_stripe_subscription_id,
    subscription_status = p_status,
    current_period_end = p_current_period_end,
    status = CASE 
      WHEN p_status = 'active' THEN 'active'
      WHEN p_status = 'trialing' THEN 'trial'
      WHEN p_status IN ('past_due', 'unpaid') THEN 'suspended'
      WHEN p_status = 'canceled' THEN 'cancelled'
      ELSE 'trial'
    END,
    updated_at = NOW()
  WHERE id = p_organization_id;
END;
$$;

-- 6. Função para registrar pagamento
-- ================================================================
CREATE OR REPLACE FUNCTION public.record_payment(
  p_organization_id UUID,
  p_stripe_payment_intent_id TEXT,
  p_stripe_invoice_id TEXT,
  p_amount DECIMAL,
  p_plan_id TEXT,
  p_status TEXT DEFAULT 'succeeded'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_id UUID;
BEGIN
  INSERT INTO public.payments (
    organization_id,
    stripe_payment_intent_id,
    stripe_invoice_id,
    amount,
    plan_id,
    status,
    paid_at
  ) VALUES (
    p_organization_id,
    p_stripe_payment_intent_id,
    p_stripe_invoice_id,
    p_amount,
    p_plan_id,
    p_status,
    CASE WHEN p_status = 'succeeded' THEN NOW() ELSE NULL END
  )
  RETURNING id INTO payment_id;
  
  RETURN payment_id;
END;
$$;

-- ================================================================
-- VERIFICAÇÕES
-- ================================================================

-- Verificar colunas adicionadas em organizations
SELECT 
  '✅ Colunas Stripe em organizations:' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'current_period_end')
ORDER BY column_name;

-- Verificar tabela payments
SELECT 
  '✅ Tabela payments criada:' as status,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'payments';

-- Verificar tabela webhook_events
SELECT 
  '✅ Tabela stripe_webhook_events criada:' as status,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'stripe_webhook_events';

-- Verificar funções
SELECT 
  '✅ Funções criadas:' as status,
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_trial_expired', 'update_subscription_status', 'record_payment')
ORDER BY routine_name;

-- ================================================================
-- ✅ CONCLUÍDO
-- ================================================================
-- Execute este SQL no Supabase SQL Editor
-- Depois configure as Edge Functions para webhook do Stripe
