-- =====================================================
-- TABELA DE PREFERÊNCIAS DE TEMA DO USUÁRIO
-- =====================================================
-- Permite que cada usuário personalize as cores do app
-- para tema claro e escuro separadamente
-- =====================================================

-- Criar tabela de preferências de tema
CREATE TABLE IF NOT EXISTS public.theme_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Cores para Tema Claro
  light_primary_color VARCHAR(7) DEFAULT '#6366f1', -- Cor principal (ex: botões, links)
  light_secondary_color VARCHAR(7) DEFAULT '#8b5cf6', -- Cor secundária (ex: destaques)
  light_accent_color VARCHAR(7) DEFAULT '#06b6d4', -- Cor de destaque
  light_text_color VARCHAR(7) DEFAULT '#0f172a', -- Cor do texto principal
  light_icon_color VARCHAR(7) DEFAULT '#64748b', -- Cor dos ícones
  
  -- Cores para Tema Escuro
  dark_primary_color VARCHAR(7) DEFAULT '#818cf8', -- Cor principal
  dark_secondary_color VARCHAR(7) DEFAULT '#a78bfa', -- Cor secundária
  dark_accent_color VARCHAR(7) DEFAULT '#22d3ee', -- Cor de destaque
  dark_text_color VARCHAR(7) DEFAULT '#f1f5f9', -- Cor do texto principal
  dark_icon_color VARCHAR(7) DEFAULT '#94a3b8', -- Cor dos ícones
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir apenas uma preferência por usuário
  CONSTRAINT unique_user_theme UNIQUE(user_id)
);

-- Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_theme_preferences_user_id 
ON public.theme_preferences(user_id);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.theme_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas suas próprias preferências
CREATE POLICY "Users can view own theme preferences"
ON public.theme_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir suas próprias preferências
CREATE POLICY "Users can insert own theme preferences"
ON public.theme_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar suas próprias preferências
CREATE POLICY "Users can update own theme preferences"
ON public.theme_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar suas próprias preferências
CREATE POLICY "Users can delete own theme preferences"
ON public.theme_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION update_theme_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_theme_preferences_updated_at 
ON public.theme_preferences;

CREATE TRIGGER trigger_update_theme_preferences_updated_at
BEFORE UPDATE ON public.theme_preferences
FOR EACH ROW
EXECUTE FUNCTION update_theme_preferences_updated_at();

-- =====================================================
-- FUNÇÃO PARA CRIAR PREFERÊNCIAS PADRÃO
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_theme_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.theme_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar preferências padrão ao criar usuário
DROP TRIGGER IF EXISTS trigger_create_default_theme_preferences 
ON auth.users;

CREATE TRIGGER trigger_create_default_theme_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_theme_preferences();

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Comentar/Descomentar conforme necessário
/*
INSERT INTO public.theme_preferences (
  user_id,
  light_primary_color,
  light_secondary_color,
  dark_primary_color,
  dark_secondary_color
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Substituir pelo UUID do usuário
  '#6366f1',
  '#8b5cf6',
  '#818cf8',
  '#a78bfa'
) ON CONFLICT (user_id) DO NOTHING;
*/

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Ver todas as preferências
-- SELECT * FROM public.theme_preferences;

-- Ver preferência de um usuário específico
-- SELECT * FROM public.theme_preferences WHERE user_id = auth.uid();

COMMENT ON TABLE public.theme_preferences IS 'Armazena as preferências de cores personalizadas de cada usuário para temas claro e escuro';
COMMENT ON COLUMN public.theme_preferences.light_primary_color IS 'Cor principal do tema claro (hex)';
COMMENT ON COLUMN public.theme_preferences.dark_primary_color IS 'Cor principal do tema escuro (hex)';
