-- ================================================
-- MIGRAÇÃO: Tabela de Clientes
-- ================================================
-- Execute este script no Supabase SQL Editor
-- IMPORTANTE: Execute TODO o script de uma vez
-- ================================================

-- 1. Criar tabela de clientes
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

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Índice para busca full-text
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING gin(
  to_tsvector('portuguese', 
    coalesce(name, '') || ' ' || 
    coalesce(email, '') || ' ' || 
    coalesce(city, '') || ' ' ||
    coalesce(phone, '')
  )
);

-- 3. Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios clientes
CREATE POLICY "Usuários podem ver seus clientes"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir seus próprios clientes
CREATE POLICY "Usuários podem criar clientes"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus próprios clientes
CREATE POLICY "Usuários podem atualizar seus clientes"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus próprios clientes
CREATE POLICY "Usuários podem deletar seus clientes"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_clients_timestamp ON clients;
CREATE TRIGGER update_clients_timestamp
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- 6. Função para buscar clientes com filtros
CREATE OR REPLACE FUNCTION search_clients(
  p_user_id UUID,
  p_search_term TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  type VARCHAR,
  person_type VARCHAR,
  cpf_cnpj VARCHAR,
  status VARCHAR,
  phone VARCHAR,
  phone_secondary VARCHAR,
  email VARCHAR,
  email_secondary VARCHAR,
  website VARCHAR,
  address TEXT,
  address_number VARCHAR,
  complement VARCHAR,
  neighborhood VARCHAR,
  city VARCHAR,
  state VARCHAR,
  zip_code VARCHAR,
  how_met_us TEXT,
  referred_by VARCHAR,
  notes TEXT,
  active_projects INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.name, c.type, c.person_type, c.cpf_cnpj, c.status,
    c.phone, c.phone_secondary, c.email, c.email_secondary, c.website,
    c.address, c.address_number, c.complement, c.neighborhood,
    c.city, c.state, c.zip_code, c.how_met_us, c.referred_by, c.notes,
    c.active_projects, c.created_at, c.updated_at
  FROM clients c
  WHERE c.user_id = p_user_id
    AND (p_search_term IS NULL OR 
         c.name ILIKE '%' || p_search_term || '%' OR
         c.email ILIKE '%' || p_search_term || '%' OR
         c.city ILIKE '%' || p_search_term || '%' OR
         c.phone ILIKE '%' || p_search_term || '%')
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_type IS NULL OR c.type = p_type)
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. View para estatísticas de clientes
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

-- ================================================
-- FIM DA MIGRAÇÃO
-- ================================================

-- ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
--
-- PRÓXIMOS PASSOS:
-- 1. A tabela "clients" foi criada
-- 2. RLS (Row Level Security) está ATIVO - cada usuário vê só seus dados
-- 3. Índices criados para performance
-- 4. Funções e triggers configurados
--
-- PARA TESTAR:
-- SELECT * FROM clients;
-- SELECT * FROM client_stats WHERE user_id = auth.uid();
--
-- PARA INSERIR UM CLIENTE DE TESTE (substitua auth.uid() pelo seu user_id):
-- INSERT INTO clients (user_id, name, type, person_type, status, phone, email, city)
-- VALUES (
--   auth.uid(),
--   'Cliente Teste',
--   'residential',
--   'pf',
--   'active',
--   '(11) 99999-9999',
--   'teste@email.com',
--   'São Paulo'
-- );
--
-- NOTA: O user_id é preenchido automaticamente pelo aplicativo
-- usando o ID do usuário autenticado (auth.uid())

