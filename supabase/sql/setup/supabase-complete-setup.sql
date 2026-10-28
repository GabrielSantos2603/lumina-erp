-- ================================================
-- LUMINA AI ERP - CONFIGURAÇÃO COMPLETA SUPABASE
-- ================================================
-- Execute este script UMA VEZ no SQL Editor do Supabase
-- Todas as tabelas serão criadas com RLS ativo
-- ================================================

-- ================================================
-- 1. TABELA: CLIENTS (Clientes)
-- ================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('residential', 'commercial')),
  person_type VARCHAR(2) NOT NULL CHECK (person_type IN ('pf', 'pj')),
  cpf_cnpj VARCHAR(18),
  status VARCHAR(20) NOT NULL DEFAULT 'potential' CHECK (status IN ('active', 'inactive', 'potential')),
  
  -- Contatos
  phone VARCHAR(20) NOT NULL,
  phone_secondary VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  email_secondary VARCHAR(255),
  website VARCHAR(255),
  
  -- Endereço
  address TEXT,
  address_number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Origem
  how_met_us TEXT,
  referred_by VARCHAR(255),
  
  -- Observações
  notes TEXT,
  
  -- Métricas
  active_projects INTEGER DEFAULT 0,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 2. TABELA: PROJECTS (Projetos)
-- ================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255), -- Cache do nome do cliente
  category VARCHAR(50) NOT NULL CHECK (category IN ('architecture', 'interior_design', 'landscape', 'renovation', 'other')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('residential', 'commercial')),
  status VARCHAR(20) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'paused', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Localização
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Datas
  start_date DATE,
  end_date DATE,
  estimated_completion DATE,
  
  -- Financeiro
  budget DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2) DEFAULT 0,
  
  -- Detalhes técnicos
  area_sqm DECIMAL(10, 2), -- Área em m²
  floors INTEGER,
  rooms INTEGER,
  bathrooms INTEGER,
  parking_spaces INTEGER,
  
  -- Mídia
  image_url TEXT,
  thumbnail_url TEXT,
  
  -- Descrição e notas
  description TEXT,
  notes TEXT,
  
  -- Equipe
  team_members UUID[], -- Array de IDs de team members
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date DESC);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 3. TABELA: TEAM (Equipe)
-- ================================================
CREATE TABLE IF NOT EXISTS team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Owner/empresa
  
  -- Informações pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Profissional
  role VARCHAR(50) NOT NULL CHECK (role IN ('architect', 'designer', 'engineer', 'manager', 'assistant', 'intern', 'other')),
  department VARCHAR(100),
  specialty VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'vacation', 'leave', 'inactive')),
  
  -- Financeiro
  salary DECIMAL(10, 2),
  weekly_hours INTEGER DEFAULT 40,
  
  -- Datas
  hire_date DATE,
  termination_date DATE,
  
  -- Métricas
  active_projects INTEGER DEFAULT 0,
  
  -- Observações
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_team_user_id ON team(user_id);
CREATE INDEX IF NOT EXISTS idx_team_email ON team(email);
CREATE INDEX IF NOT EXISTS idx_team_status ON team(status);
CREATE INDEX IF NOT EXISTS idx_team_role ON team(role);

-- RLS
ALTER TABLE team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team" ON team FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create team members" ON team FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own team" ON team FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own team" ON team FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 4. TABELA: TRANSACTIONS (Financeiro)
-- ================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Informações básicas
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  
  -- Pagamento
  method VARCHAR(20) CHECK (method IN ('pix', 'boleto', 'card', 'transfer', 'cash', 'other')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  
  -- Datas
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Relacionamentos
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name VARCHAR(255), -- Cache
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255), -- Cache
  
  -- Parcelamento
  installments INTEGER DEFAULT 1,
  current_installment INTEGER DEFAULT 1,
  
  -- Observações
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 5. TABELA: MEETINGS (Reuniões)
-- ================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Informações básicas
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  
  -- Data e hora
  meeting_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  
  -- Relacionamentos
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name VARCHAR(255), -- Cache
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(255), -- Cache
  
  -- Participantes (array de emails ou nomes)
  participants TEXT[],
  
  -- Observações
  notes TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);

-- RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings" ON meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create meetings" ON meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meetings" ON meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meetings" ON meetings FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 6. TABELA: MEETING_COMMENTS (Comentários de Reuniões)
-- ================================================
CREATE TABLE IF NOT EXISTS meeting_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Conteúdo
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meeting_comments_meeting_id ON meeting_comments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_comments_created_at ON meeting_comments(created_at DESC);

-- RLS
ALTER TABLE meeting_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meeting comments" ON meeting_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON meeting_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON meeting_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON meeting_comments FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 7. TABELA: MEETING_ATTACHMENTS (Anexos de Reuniões)
-- ================================================
CREATE TABLE IF NOT EXISTS meeting_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Arquivo
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  
  -- Metadados
  uploaded_by_name VARCHAR(255) NOT NULL,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meeting_attachments_meeting_id ON meeting_attachments(meeting_id);

-- RLS
ALTER TABLE meeting_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meeting attachments" ON meeting_attachments FOR SELECT USING (true);
CREATE POLICY "Users can create attachments" ON meeting_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own attachments" ON meeting_attachments FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- FUNÇÕES AUXILIARES
-- ================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_updated_at ON team;
CREATE TRIGGER update_team_updated_at BEFORE UPDATE ON team
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_comments_updated_at ON meeting_comments;
CREATE TRIGGER update_meeting_comments_updated_at BEFORE UPDATE ON meeting_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- VIEWS ÚTEIS
-- ================================================

-- View de estatísticas de clientes
CREATE OR REPLACE VIEW client_stats AS
SELECT 
  user_id,
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE status = 'active') as active_clients,
  COUNT(*) FILTER (WHERE status = 'potential') as potential_clients,
  COUNT(*) FILTER (WHERE type = 'residential') as residential_clients,
  COUNT(*) FILTER (WHERE type = 'commercial') as commercial_clients,
  SUM(active_projects) as total_active_projects
FROM clients
GROUP BY user_id;

-- View de estatísticas de projetos
CREATE OR REPLACE VIEW project_stats AS
SELECT 
  user_id,
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE status = 'planning') as planning_projects,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_projects,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
  SUM(budget) as total_budget,
  SUM(actual_cost) as total_actual_cost,
  SUM(area_sqm) as total_area_sqm
FROM projects
GROUP BY user_id;

-- View de fluxo de caixa mensal
CREATE OR REPLACE VIEW monthly_cash_flow AS
SELECT 
  user_id,
  DATE_TRUNC('month', due_date) as month,
  SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as expense,
  SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) - 
  SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as balance
FROM transactions
WHERE status = 'paid'
GROUP BY user_id, DATE_TRUNC('month', due_date)
ORDER BY month DESC;

-- View de contas a pagar/receber
CREATE OR REPLACE VIEW accounts_summary AS
SELECT 
  user_id,
  SUM(CASE WHEN type = 'income' AND status = 'pending' THEN amount ELSE 0 END) as receivable,
  SUM(CASE WHEN type = 'expense' AND status = 'pending' THEN amount ELSE 0 END) as payable,
  SUM(CASE WHEN type = 'income' AND status = 'overdue' THEN amount ELSE 0 END) as overdue_receivable,
  SUM(CASE WHEN type = 'expense' AND status = 'overdue' THEN amount ELSE 0 END) as overdue_payable
FROM transactions
WHERE status IN ('pending', 'overdue')
GROUP BY user_id;

-- ================================================
-- STORAGE BUCKETS
-- ================================================

-- NOTA: Execute estes comandos MANUALMENTE no painel do Supabase Storage
-- ou através da API, pois não podem ser executados via SQL Editor:

-- 1. Criar bucket para imagens de projetos:
--    Nome: project-images
--    Público: true (ou false se preferir privado)

-- 2. Criar bucket para anexos de reuniões:
--    Nome: meeting-attachments
--    Público: false

-- 3. Criar bucket para documentos:
--    Nome: documents
--    Público: false

-- ================================================
-- GRANTS
-- ================================================

GRANT ALL ON clients TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON team TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON meetings TO authenticated;
GRANT ALL ON meeting_comments TO authenticated;
GRANT ALL ON meeting_attachments TO authenticated;

-- ================================================
-- ✅ SETUP COMPLETO!
-- ================================================

-- PRÓXIMOS PASSOS:
-- 1. ✅ Tabelas criadas com sucesso
-- 2. ✅ RLS ativo em todas as tabelas
-- 3. ✅ Índices criados para performance
-- 4. ✅ Triggers de updated_at configurados
-- 5. ✅ Views de estatísticas criadas
-- 
-- MANUAL:
-- - Criar buckets de storage no painel (ver comentários acima)
-- - Configurar políticas de storage se necessário
-- 
-- PARA TESTAR:
-- SELECT * FROM clients;
-- SELECT * FROM projects;
-- SELECT * FROM team;
-- SELECT * FROM transactions;
-- SELECT * FROM meetings;
-- SELECT * FROM client_stats WHERE user_id = auth.uid();
-- SELECT * FROM project_stats WHERE user_id = auth.uid();
-- SELECT * FROM monthly_cash_flow WHERE user_id = auth.uid();
-- SELECT * FROM accounts_summary WHERE user_id = auth.uid();


