-- ================================================================
-- STRIPE INTEGRATION - Setup Simples (Execute por partes)
-- ================================================================

-- PARTE 1: Verificar estrutura atual
-- ================================================================
SELECT 'Verificando tabela organizations...' as step;

SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
ORDER BY ordinal_position;

-- ================================================================
-- PARTE 2: Adicionar colunas necessárias (COPIE E EXECUTE SEPARADAMENTE)
-- ================================================================

-- Adicionar coluna type (se necessário)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard';

-- Adicionar colunas do Stripe
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- ================================================================
-- PARTE 3: Adicionar constraints (COPIE E EXECUTE SEPARADAMENTE)
-- ================================================================

-- Adicionar UNIQUE constraint para stripe_customer_id
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

-- Adicionar UNIQUE constraint para stripe_subscription_id
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

-- ================================================================
-- PARTE 4: Criar tabela de pagamentos (COPIE E EXECUTE SEPARADAMENTE)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Stripe IDs
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,
  
  -- Detalhes do pagamento
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL,
  
  -- Metadados
  plan_id TEXT NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  
  -- Datas
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- PARTE 5: Criar índices em payments (COPIE E EXECUTE SEPARADAMENTE)
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_payments_organization ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON public.payments(stripe_payment_intent_id);

-- ================================================================
-- PARTE 6: Habilitar RLS em payments (COPIE E EXECUTE SEPARADAMENTE)
-- ================================================================

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

-- ================================================================
-- PARTE 7: Criar tabela de webhook events (COPIE E EXECUTE SEPARADAMENTE)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- PARTE 8: Criar índices em webhook_events (COPIE E EXECUTE SEPARADAMENTE)
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON public.stripe_webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.stripe_webhook_events(stripe_event_id);

-- ================================================================
-- PARTE 9: Criar funções (COPIE E EXECUTE SEPARADAMENTE)
-- ================================================================

-- Função 1: Verificar se trial expirou
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
  
  IF org_status != 'trial' THEN
    RETURN FALSE;
  END IF;
  
  RETURN trial_end < NOW();
END;
$$;

-- Função 2: Atualizar status de assinatura
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

-- Função 3: Registrar pagamento
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
-- VERIFICAÇÃO FINAL
-- ================================================================

-- Verificar colunas em organizations
SELECT 
  'COLUNAS EM ORGANIZATIONS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'current_period_end', 'type')
ORDER BY column_name;

-- Verificar tabelas criadas
SELECT 
  'TABELAS CRIADAS' as check_type,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('payments', 'stripe_webhook_events')
ORDER BY table_name;

-- Verificar funções criadas
SELECT 
  'FUNÇÕES CRIADAS' as check_type,
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_trial_expired', 'update_subscription_status', 'record_payment')
ORDER BY routine_name;

-- ================================================================
-- ✅ CONCLUÍDO
-- ================================================================
