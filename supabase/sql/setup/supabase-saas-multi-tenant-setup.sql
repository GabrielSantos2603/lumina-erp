-- ================================================================
-- LUMINA AI ERP - CONFIGURAÇÃO MULTI-TENANT SAAS COM STRIPE
-- ================================================================
-- Execute este script no SQL Editor do Supabase
-- Transforma a aplicação em SaaS com separação total de dados
-- Integração com Stripe para assinaturas de R$ 64,99/mês
-- ================================================================

-- ================================================================
-- 1. TABELA: ORGANIZATIONS (Contas/Organizações)
-- ================================================================
-- Cada organização representa uma conta SaaS isolada
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações Básicas
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL amigável (ex: minhaempresa)
  subdomain TEXT UNIQUE, -- Subdomínio (ex: minhaempresa.luminaerp.com)
  
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
  stripe_subscription_status TEXT, -- active, canceled, incomplete, etc
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON public.organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON public.organizations(stripe_subscription_id);

-- RLS (será habilitado após criar organization_members)
-- ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 2. TABELA: ORGANIZATION_MEMBERS (Usuários da Organização)
-- ================================================================
-- Relaciona usuários com organizações (multi-tenant)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Papel do usuário
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'guest')),
  
  -- Permissões específicas (JSON)
  permissions JSONB DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Usuário não pode estar duplicado na mesma org
  UNIQUE(organization_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);

-- RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Políticas: Membros podem ver membros da mesma organização
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

-- Políticas: Admins podem adicionar membros
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
-- 2.1 HABILITAR RLS E POLICIES PARA ORGANIZATIONS
-- ================================================================
-- Agora que organization_members existe, podemos criar as policies

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Políticas: Membros podem ver sua organização
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

-- Políticas: Apenas owners podem atualizar
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
-- 3. TABELA: SUBSCRIPTION_HISTORY (Histórico de Assinaturas)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Dados da assinatura
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Stripe
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  
  -- Datas
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscription_history_org ON public.subscription_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON public.subscription_history(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_paid_at ON public.subscription_history(paid_at);

-- RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

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
-- 4. ATUALIZAR TABELAS EXISTENTES - ADICIONAR organization_id
-- ================================================================

-- 4.1 Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);

-- Atualizar RLS policies de profiles
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

-- Atualizar RLS policies de clients
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

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

-- Atualizar RLS policies de projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

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

-- Função para obter organization_id do usuário atual
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

-- Função para verificar se usuário é owner/admin
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

-- Função para criar organização automaticamente no signup
CREATE OR REPLACE FUNCTION handle_new_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  org_slug TEXT;
BEGIN
  -- Obter email do usuário
  user_email := NEW.email;
  
  -- Gerar slug único baseado no email
  org_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(user_email, '@', 1), '[^a-z0-9]', '', 'g'));
  org_slug := org_slug || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  -- Criar organização
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
    NOW() + INTERVAL '14 days' -- 14 dias de trial
  ) RETURNING id INTO new_org_id;
  
  -- Adicionar usuário como owner
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
  
  -- Criar profile com organization_id
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

-- Trigger para criar organização automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_organization ON auth.users;
CREATE TRIGGER on_auth_user_created_organization
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_organization();

-- ================================================================
-- 6. STRIPE WEBHOOKS - Tabela para logs
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
-- 7. VIEWS ÚTEIS
-- ================================================================

-- View: Organizações com informações de assinatura
CREATE OR REPLACE VIEW organization_subscriptions AS
SELECT 
  o.id,
  o.name,
  o.slug,
  o.status,
  o.plan,
  o.subscription_price,
  o.currency,
  o.stripe_subscription_status,
  o.stripe_current_period_end,
  o.trial_ends_at,
  CASE 
    WHEN o.status = 'trial' AND o.trial_ends_at < NOW() THEN 'expired'
    WHEN o.status = 'trial' THEN 'in_trial'
    WHEN o.stripe_subscription_status = 'active' THEN 'active'
    ELSE 'inactive'
  END AS subscription_status,
  (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = o.id) AS member_count,
  (SELECT COUNT(*) FROM public.projects WHERE organization_id = o.id) AS project_count
FROM public.organizations o;

-- View: Estatísticas de uso por organização
CREATE OR REPLACE VIEW organization_usage_stats AS
SELECT 
  o.id AS organization_id,
  o.name AS organization_name,
  o.max_users,
  o.max_projects,
  o.max_storage_gb,
  (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = o.id AND status = 'active') AS active_users,
  (SELECT COUNT(*) FROM public.projects WHERE organization_id = o.id) AS total_projects,
  (SELECT COUNT(*) FROM public.clients WHERE organization_id = o.id) AS total_clients,
  (SELECT COUNT(*) FROM public.meetings WHERE organization_id = o.id) AS total_meetings
FROM public.organizations o;

-- ================================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================================

COMMENT ON TABLE public.organizations IS 'Organizações/Contas SaaS - cada cliente tem uma organização isolada';
COMMENT ON TABLE public.organization_members IS 'Membros das organizações - relaciona usuários com suas organizações';
COMMENT ON TABLE public.subscription_history IS 'Histórico de pagamentos e assinaturas via Stripe';
COMMENT ON COLUMN public.organizations.stripe_customer_id IS 'ID do cliente no Stripe';
COMMENT ON COLUMN public.organizations.stripe_subscription_id IS 'ID da assinatura no Stripe';
COMMENT ON COLUMN public.organizations.subscription_price IS 'Preço da assinatura em reais (padrão: R$ 64,99)';

-- ================================================================
-- 9. DADOS INICIAIS (OPCIONAL)
-- ================================================================

-- Criar plano padrão de pricing (para referência)
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

INSERT INTO public.pricing_plans (name, display_name, description, price_monthly, price_yearly, max_users, max_projects, max_storage_gb, features, sort_order)
VALUES 
  ('trial', 'Trial Gratuito', '14 dias grátis para testar', 0.00, 0.00, 2, 10, 1, '["Acesso completo por 14 dias", "Suporte por email", "Limite de 2 usuários"]', 0),
  ('starter', 'Starter', 'Ideal para pequenas equipes', 64.99, 649.90, 5, 50, 10, '["Até 5 usuários", "50 projetos", "10GB de armazenamento", "Suporte prioritário", "Relatórios básicos"]', 1),
  ('professional', 'Professional', 'Para equipes em crescimento', 149.99, 1499.90, 15, 200, 50, '["Até 15 usuários", "Projetos ilimitados", "50GB de armazenamento", "Suporte 24/7", "Relatórios avançados", "API access"]', 2),
  ('enterprise', 'Enterprise', 'Solução completa para grandes empresas', 399.99, 3999.90, NULL, NULL, NULL, '["Usuários ilimitados", "Projetos ilimitados", "Armazenamento ilimitado", "Suporte dedicado", "Customizações", "SLA garantido"]', 3)
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- ✅ SCRIPT CONCLUÍDO
-- ================================================================

-- Para verificar se tudo foi criado corretamente:
SELECT 
  'organizations' as table_name, 
  COUNT(*) as count 
FROM public.organizations
UNION ALL
SELECT 
  'organization_members', 
  COUNT(*) 
FROM public.organization_members
UNION ALL
SELECT 
  'subscription_history', 
  COUNT(*) 
FROM public.subscription_history;

-- Verificar RLS ativo em todas as tabelas críticas
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'organization_members', 'clients', 'projects', 'transactions', 'meetings', 'team')
ORDER BY tablename;
