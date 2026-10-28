-- Criar tabela de empresas (companies)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações Básicas
  company_name TEXT NOT NULL,
  trading_name TEXT, -- Nome fantasia
  legal_nature TEXT, -- MEI, LTDA, SA, etc
  
  -- Documentos
  cnpj TEXT UNIQUE,
  state_registration TEXT, -- Inscrição Estadual
  municipal_registration TEXT, -- Inscrição Municipal
  
  -- Contato
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  
  -- Endereço
  zip_code TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  
  -- Dados Bancários
  bank_name TEXT,
  bank_code TEXT,
  agency TEXT,
  account_number TEXT,
  account_type TEXT, -- Corrente, Poupança
  pix_key TEXT,
  pix_type TEXT, -- CPF, CNPJ, Email, Telefone, Aleatória
  
  -- Informações Fiscais
  tax_regime TEXT, -- Simples Nacional, Lucro Presumido, Lucro Real
  cnae TEXT, -- Código CNAE principal
  cnae_description TEXT,
  
  -- Configurações
  logo_url TEXT,
  primary_color TEXT DEFAULT '#7C3AED',
  secondary_color TEXT DEFAULT '#A78BFA',
  
  -- Informações Adicionais
  founded_date DATE,
  employee_count INTEGER,
  annual_revenue DECIMAL(15,2),
  
  -- Redes Sociais
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  behance TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);

-- RLS (Row Level Security)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas sua própria empresa
CREATE POLICY "Users can view their own company"
  ON public.companies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir sua própria empresa
CREATE POLICY "Users can insert their own company"
  ON public.companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar sua própria empresa
CREATE POLICY "Users can update their own company"
  ON public.companies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar sua própria empresa
CREATE POLICY "Users can delete their own company"
  ON public.companies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Comentários na tabela
COMMENT ON TABLE public.companies IS 'Armazena informações completas das empresas dos usuários';
COMMENT ON COLUMN public.companies.cnpj IS 'CNPJ da empresa (somente números)';
COMMENT ON COLUMN public.companies.tax_regime IS 'Regime tributário: Simples Nacional, Lucro Presumido ou Lucro Real';
COMMENT ON COLUMN public.companies.pix_type IS 'Tipo de chave PIX: CPF, CNPJ, Email, Telefone ou Aleatória';
