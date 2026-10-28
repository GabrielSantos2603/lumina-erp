-- ==================================================
-- LUMINA AI ERP - TABELA DE MÍDIAS DE PROJETOS
-- ==================================================
-- Este script cria a tabela para armazenar mídias dos projetos
-- (renders, plantas, descritivos, fotos, modelos 3D, etc.)
-- ==================================================

-- 1. Criar tabela de mídias de projetos
CREATE TABLE IF NOT EXISTS project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Informações do arquivo
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('renders', 'plantas', 'descritivos', 'fotos', '3d', 'documentos', 'outros')),
  
  -- Storage
  storage_path TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  
  -- Organização
  tags TEXT[] DEFAULT '{}',
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_project_media_project_id ON project_media(project_id);
CREATE INDEX IF NOT EXISTS idx_project_media_user_id ON project_media(user_id);
CREATE INDEX IF NOT EXISTS idx_project_media_category ON project_media(category);
CREATE INDEX IF NOT EXISTS idx_project_media_created_at ON project_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_media_tags ON project_media USING GIN(tags);

-- 3. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_project_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_media_updated_at
  BEFORE UPDATE ON project_media
  FOR EACH ROW
  EXECUTE FUNCTION update_project_media_updated_at();

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE project_media ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de RLS

-- Política de SELECT: usuários podem ver mídias de seus próprios projetos
CREATE POLICY "Users can view media from their projects"
  ON project_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_media.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Política de INSERT: usuários podem adicionar mídias aos seus projetos
CREATE POLICY "Users can upload media to their projects"
  ON project_media
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Política de UPDATE: usuários podem atualizar mídias que enviaram
CREATE POLICY "Users can update their own media"
  ON project_media
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política de DELETE: usuários podem deletar mídias que enviaram
CREATE POLICY "Users can delete their own media"
  ON project_media
  FOR DELETE
  USING (user_id = auth.uid());

-- 6. Função para obter estatísticas de mídias por projeto
CREATE OR REPLACE FUNCTION get_project_media_stats(p_project_id UUID)
RETURNS TABLE (
  total_files BIGINT,
  total_size BIGINT,
  renders_count BIGINT,
  plantas_count BIGINT,
  descritivos_count BIGINT,
  fotos_count BIGINT,
  models_3d_count BIGINT,
  documentos_count BIGINT,
  outros_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_files,
    COALESCE(SUM(file_size), 0)::BIGINT as total_size,
    COUNT(*) FILTER (WHERE category = 'renders')::BIGINT as renders_count,
    COUNT(*) FILTER (WHERE category = 'plantas')::BIGINT as plantas_count,
    COUNT(*) FILTER (WHERE category = 'descritivos')::BIGINT as descritivos_count,
    COUNT(*) FILTER (WHERE category = 'fotos')::BIGINT as fotos_count,
    COUNT(*) FILTER (WHERE category = '3d')::BIGINT as models_3d_count,
    COUNT(*) FILTER (WHERE category = 'documentos')::BIGINT as documentos_count,
    COUNT(*) FILTER (WHERE category = 'outros')::BIGINT as outros_count
  FROM project_media
  WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para buscar mídias com paginação
CREATE OR REPLACE FUNCTION get_project_media_paginated(
  p_project_id UUID,
  p_category VARCHAR DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  user_id UUID,
  name VARCHAR,
  original_name VARCHAR,
  file_type VARCHAR,
  file_size BIGINT,
  category VARCHAR,
  storage_path TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.project_id,
    pm.user_id,
    pm.name,
    pm.original_name,
    pm.file_type,
    pm.file_size,
    pm.category,
    pm.storage_path,
    pm.thumbnail_url,
    pm.tags,
    pm.created_at,
    pm.updated_at
  FROM project_media pm
  WHERE pm.project_id = p_project_id
    AND (p_category IS NULL OR pm.category = p_category)
  ORDER BY pm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 8. Comentários para documentação
COMMENT ON TABLE project_media IS 'Armazena metadados de arquivos de mídia dos projetos (renders, plantas, descritivos, etc.)';
COMMENT ON COLUMN project_media.category IS 'Categoria do arquivo: renders, plantas, descritivos, fotos, 3d, documentos, outros';
COMMENT ON COLUMN project_media.storage_path IS 'Caminho do arquivo no Supabase Storage';
COMMENT ON COLUMN project_media.tags IS 'Tags para organização e busca dos arquivos';

-- ==================================================
-- INSTRUÇÕES PARA CONFIGURAR O STORAGE
-- ==================================================
-- Execute os seguintes passos no Dashboard do Supabase:
--
-- 1. Ir em Storage → Create a new bucket
-- 2. Nome: project-media
-- 3. Public: Desabilitado (privado)
-- 4. Allowed MIME types: (deixar vazio para permitir todos)
-- 5. Criar as seguintes políticas de storage:
--
-- POLÍTICA DE UPLOAD:
-- Nome: Users can upload media to their projects
-- Allowed operation: INSERT
-- Policy definition:
-- (bucket_id = 'project-media' AND 
--  auth.uid()::text = (storage.foldername(name))[1])
--
-- POLÍTICA DE SELECT:
-- Nome: Users can view their project media
-- Allowed operation: SELECT
-- Policy definition:
-- (bucket_id = 'project-media' AND 
--  auth.uid()::text = (storage.foldername(name))[1])
--
-- POLÍTICA DE DELETE:
-- Nome: Users can delete their project media
-- Allowed operation: DELETE
-- Policy definition:
-- (bucket_id = 'project-media' AND 
--  auth.uid()::text = (storage.foldername(name))[1])
--
-- ==================================================

-- TESTE RÁPIDO
-- SELECT * FROM get_project_media_stats('seu-project-id-aqui');
-- SELECT * FROM get_project_media_paginated('seu-project-id-aqui', NULL, 10, 0);

