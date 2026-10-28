-- ==================================================
-- TABELA DE PERFIS DE USUÁRIOS (PROFILES)
-- ==================================================
-- Esta tabela armazena informações adicionais dos usuários
-- complementando a tabela auth.users do Supabase
-- ==================================================

-- 1. Criar tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
  
  -- Preferências
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'pt-BR',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de RLS

-- Política de SELECT: usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política de INSERT: usuários podem criar seu próprio perfil
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política de UPDATE: usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política de DELETE: usuários podem deletar seu próprio perfil
CREATE POLICY "Users can delete their own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- 6. Função para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 8. Criar perfis para usuários existentes (se houver)
INSERT INTO profiles (id, email, full_name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 9. Verificar perfis criados
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ==================================================
-- RESULTADO ESPERADO:
-- 
-- Você deve ver seu perfil listado com:
-- - id: UUID do usuário
-- - email: Seu email
-- - full_name: Nome ou email
-- - role: 'user'
-- - created_at: Data de criação
-- ==================================================

-- 10. Comentários para documentação
COMMENT ON TABLE profiles IS 'Perfis de usuários com informações adicionais';
COMMENT ON COLUMN profiles.role IS 'Papel do usuário: user, admin, manager';
COMMENT ON COLUMN profiles.theme IS 'Tema preferido: light, dark, system';

-- ==================================================
-- FIM DA CONFIGURAÇÃO
-- ==================================================

-- TROUBLESHOOTING:
-- Se o erro 404 persistir:
--
-- 1. Verifique se a tabela foi criada:
--    SELECT * FROM profiles LIMIT 1;
--
-- 2. Verifique se seu perfil existe:
--    SELECT * FROM profiles WHERE id = auth.uid();
--
-- 3. Se não existir, crie manualmente:
--    INSERT INTO profiles (id, email, full_name)
--    VALUES (auth.uid(), 'seu@email.com', 'Seu Nome');
--
-- 4. Faça logout e login novamente na aplicação
--
-- ==================================================

