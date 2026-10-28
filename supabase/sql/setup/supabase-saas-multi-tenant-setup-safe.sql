-- ================================================================
-- LUMINA AI ERP - CONFIGURAÇÃO MULTI-TENANT SAAS COM STRIPE
-- ================================================================
-- VERSÃO SEGURA - Pode ser executada múltiplas vezes
-- ================================================================

-- ================================================================
-- 1. TABELA: ORGANIZATIONS (Contas/Organizações)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações Básicas
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  
  -- Empresa
  company_name TEXT,
  cnpj TEXT,
  
  -- Contato
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Endereço
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  
  -- Configurações
  logo_url TEXT,
  primary_color TEXT DEFAULT '#7C3AED',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR',
  
  -- Limites e Quotas
  max_users INTEGER DEFAULT 5,
  max_projects INTEGER DEFAULT 50,
  max_storage_gb INTEGER DEFAULT 10,
  
  -- Status da Conta
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,
  stripe_current_period_start TIMESTAMPTZ,
  stripe_current_period_end TIMESTAMPTZ,
  stripe_cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Assinatura
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('trial', 'starter', 'professional', 'enterprise')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  subscription_price DECIMAL(10,2) DEFAULT 64.99,
  currency TEXT DEFAULT 'BRL',
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON public.organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON public.organizations(stripe_subscription_id);

-- ================================================================
-- 2. TABELA: ORGANIZATION_MEMBERS (Usuários da Organização)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'guest')),
  permissions JSONB DEFAULT '{}',
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);

-- RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
CREATE POLICY "Members can view organization members"
  ON public.organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert organization members" ON public.organization_members;
CREATE POLICY "Admins can insert organization members"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ================================================================
-- 2.1 RLS PARA ORGANIZATIONS
-- ================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;
CREATE POLICY "Members can view their organization"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update their organization" ON public.organizations;
CREATE POLICY "Owners can update their organization"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ================================================================
-- 3. TABELA: SUBSCRIPTION_HISTORY
-- ================================================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_org ON public.subscription_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON public.subscription_history(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_paid_at ON public.subscription_history(paid_at);

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view subscription history" ON public.subscription_history;
CREATE POLICY "Owners can view subscription history"
  ON public.subscription_history
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ================================================================
-- 4. ADICIONAR organization_id NAS TABELAS EXISTENTES
-- ================================================================

-- 4.1 Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- 4.2 Clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);

DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view organization clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create organization clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update organization clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete organization clients" ON public.clients;

CREATE POLICY "Users can view organization clients" ON public.clients
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization clients" ON public.clients
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization clients" ON public.clients
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization clients" ON public.clients
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- 4.3 Projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(organization_id);

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view organization projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create organization projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update organization projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete organization projects" ON public.projects;

CREATE POLICY "Users can view organization projects" ON public.projects
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization projects" ON public.projects
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization projects" ON public.projects
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization projects" ON public.projects
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- 4.4 Transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_org ON public.transactions(organization_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view organization transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create organization transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update organization transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete organization transactions" ON public.transactions;

CREATE POLICY "Users can view organization transactions" ON public.transactions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization transactions" ON public.transactions
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization transactions" ON public.transactions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization transactions" ON public.transactions
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- 4.5 Meetings
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_meetings_org ON public.meetings(organization_id);

DROP POLICY IF EXISTS "Users can view own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can view organization meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can create organization meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update organization meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete organization meetings" ON public.meetings;

CREATE POLICY "Users can view organization meetings" ON public.meetings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization meetings" ON public.meetings
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization meetings" ON public.meetings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization meetings" ON public.meetings
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- 4.6 Team
ALTER TABLE public.team 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_team_org ON public.team(organization_id);

DROP POLICY IF EXISTS "Users can view own team" ON public.team;
DROP POLICY IF EXISTS "Users can create team members" ON public.team;
DROP POLICY IF EXISTS "Users can update own team" ON public.team;
DROP POLICY IF EXISTS "Users can delete own team" ON public.team;
DROP POLICY IF EXISTS "Users can view organization team" ON public.team;
DROP POLICY IF EXISTS "Users can create organization team" ON public.team;
DROP POLICY IF EXISTS "Users can update organization team" ON public.team;
DROP POLICY IF EXISTS "Users can delete organization team" ON public.team;

CREATE POLICY "Users can view organization team" ON public.team
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization team" ON public.team
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization team" ON public.team
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization team" ON public.team
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ================================================================
-- 5. FUNÇÕES AUXILIARES
-- ================================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_organization_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  org_slug TEXT;
BEGIN
  user_email := NEW.email;
  
  org_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(user_email, '@', 1), '[^a-z0-9]', '', 'g'));
  org_slug := org_slug || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  INSERT INTO public.organizations (
    name,
    slug,
    email,
    status,
    plan,
    trial_ends_at
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'empresa', 'Minha Empresa'),
    org_slug,
    user_email,
    'trial',
    'trial',
    NOW() + INTERVAL '14 days'
  ) RETURNING id INTO new_org_id;
  
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    status
  ) VALUES (
    new_org_id,
    NEW.id,
    'owner',
    'active'
  );
  
  INSERT INTO public.profiles (
    id,
    email,
    nome,
    empresa,
    organization_id,
    role
  ) VALUES (
    NEW.id,
    user_email,
    COALESCE(NEW.raw_user_meta_data->>'nome', SPLIT_PART(user_email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'empresa', 'Minha Empresa'),
    new_org_id,
    'user'
  ) ON CONFLICT (id) DO UPDATE SET
    organization_id = new_org_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_organization ON auth.users;
CREATE TRIGGER on_auth_user_created_organization
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_organization();

-- ================================================================
-- 6. STRIPE WEBHOOKS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON public.stripe_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_org ON public.stripe_webhook_events(organization_id);

-- ================================================================
-- 7. PRICING PLANS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  max_users INTEGER,
  max_projects INTEGER,
  max_storage_gb INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.pricing_plans (name, display_name, description, price_monthly, max_users, max_projects, max_storage_gb, features, sort_order)
VALUES 
  ('starter', 'Starter', 'Ideal para pequenas equipes', 64.99, 5, 50, 10, '["Até 5 usuários", "50 projetos", "10GB de armazenamento", "Suporte prioritário"]', 1)
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- ✅ SCRIPT CONCLUÍDO - VERIFICAÇÃO
-- ================================================================

SELECT 'Tabelas criadas:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('organizations', 'organization_members', 'subscription_history', 'pricing_plans');

SELECT 'Colunas organization_id adicionadas:' as status;
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'clients', 'projects', 'meetings', 'transactions', 'team')
  AND column_name = 'organization_id';
