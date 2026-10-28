-- Criação da tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias preferências
CREATE POLICY "Users can view their own preferences"
ON user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuários podem inserir suas próprias preferências
CREATE POLICY "Users can insert their own preferences"
ON user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias preferências
CREATE POLICY "Users can update their own preferences"
ON user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias preferências
CREATE POLICY "Users can delete their own preferences"
ON user_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE user_preferences IS 'Preferências personalizadas dos usuários';
COMMENT ON COLUMN user_preferences.user_id IS 'ID do usuário (FK para auth.users)';
COMMENT ON COLUMN user_preferences.preferences IS 'Objeto JSON com todas as preferências do usuário';
COMMENT ON COLUMN user_preferences.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN user_preferences.updated_at IS 'Data da última atualização';
