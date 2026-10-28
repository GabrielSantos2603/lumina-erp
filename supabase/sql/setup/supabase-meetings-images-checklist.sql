-- ====================================
-- SUPABASE: Meeting Images & Checklist Enhancement
-- ====================================
-- Este script adiciona suporte para:
-- 1. Imagens anexadas a reuniões
-- 2. Checklist de tarefas
-- 3. Storage bucket para meeting-images
-- 4. RLS policies para proteção
-- ====================================

-- 1. CRIAR STORAGE BUCKET PARA IMAGENS DE REUNIÕES
-- ====================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-images',
  'meeting-images',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. STORAGE POLICIES PARA MEETING-IMAGES
-- ====================================

-- Permitir usuários autenticados verem imagens de suas reuniões
CREATE POLICY "Usuários podem visualizar imagens de reuniões próprias"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'meeting-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir usuários autenticados fazerem upload de imagens
CREATE POLICY "Usuários podem fazer upload de imagens de reuniões"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meeting-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir usuários deletarem suas próprias imagens
CREATE POLICY "Usuários podem deletar suas próprias imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'meeting-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. TABELA DE IMAGENS DE REUNIÕES
-- ====================================
CREATE TABLE IF NOT EXISTS meeting_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  display_order INT DEFAULT 0,
  
  CONSTRAINT fk_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_meeting_images_meeting ON meeting_images(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_images_uploaded_by ON meeting_images(uploaded_by);

-- RLS para meeting_images
ALTER TABLE meeting_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver imagens de suas reuniões"
ON meeting_images FOR SELECT
TO authenticated
USING (
  meeting_id IN (
    SELECT id FROM meetings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem inserir imagens em suas reuniões"
ON meeting_images FOR INSERT
TO authenticated
WITH CHECK (
  meeting_id IN (
    SELECT id FROM meetings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar imagens de suas reuniões"
ON meeting_images FOR DELETE
TO authenticated
USING (
  meeting_id IN (
    SELECT id FROM meetings WHERE user_id = auth.uid()
  )
);

-- 4. TABELA DE CHECKLIST
-- ====================================
CREATE TABLE IF NOT EXISTS meeting_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  CONSTRAINT fk_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_meeting_checklist_meeting ON meeting_checklist(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_checklist_completed ON meeting_checklist(completed);

-- RLS para meeting_checklist
ALTER TABLE meeting_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver checklist de suas reuniões"
ON meeting_checklist FOR SELECT
TO authenticated
USING (
  meeting_id IN (
    SELECT id FROM meetings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem inserir itens no checklist"
ON meeting_checklist FOR INSERT
TO authenticated
WITH CHECK (
  meeting_id IN (
    SELECT id FROM meetings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar checklist"
ON meeting_checklist FOR UPDATE
TO authenticated
USING (
  meeting_id IN (
    SELECT id FROM meetings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar itens do checklist"
ON meeting_checklist FOR DELETE
TO authenticated
USING (
  meeting_id IN (
    SELECT id FROM meetings WHERE user_id = auth.uid()
  )
);

-- 5. FUNÇÃO PARA OBTER PROGRESSO DO CHECKLIST
-- ====================================
CREATE OR REPLACE FUNCTION get_meeting_checklist_progress(meeting_uuid UUID)
RETURNS TABLE (
  total_items BIGINT,
  completed_items BIGINT,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_items,
    COUNT(*) FILTER (WHERE completed = true)::BIGINT AS completed_items,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    END AS progress_percentage
  FROM meeting_checklist
  WHERE meeting_id = meeting_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ADICIONAR COLUNAS EXTRAS NA TABELA MEETINGS (OPCIONAL)
-- ====================================
-- Para tracking rápido sem joins

ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS image_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS checklist_total INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS checklist_completed INT DEFAULT 0;

-- 7. TRIGGER PARA ATUALIZAR CONTADORES
-- ====================================

-- Trigger para atualizar image_count
CREATE OR REPLACE FUNCTION update_meeting_image_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE meetings
    SET image_count = (
      SELECT COUNT(*) FROM meeting_images WHERE meeting_id = COALESCE(NEW.meeting_id, OLD.meeting_id)
    )
    WHERE id = COALESCE(NEW.meeting_id, OLD.meeting_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_meeting_image_count ON meeting_images;
CREATE TRIGGER trigger_update_meeting_image_count
AFTER INSERT OR DELETE ON meeting_images
FOR EACH ROW EXECUTE FUNCTION update_meeting_image_count();

-- Trigger para atualizar checklist counts
CREATE OR REPLACE FUNCTION update_meeting_checklist_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE meetings
    SET 
      checklist_total = (
        SELECT COUNT(*) FROM meeting_checklist WHERE meeting_id = COALESCE(NEW.meeting_id, OLD.meeting_id)
      ),
      checklist_completed = (
        SELECT COUNT(*) FROM meeting_checklist WHERE meeting_id = COALESCE(NEW.meeting_id, OLD.meeting_id) AND completed = true
      )
    WHERE id = COALESCE(NEW.meeting_id, OLD.meeting_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_meeting_checklist_count ON meeting_checklist;
CREATE TRIGGER trigger_update_meeting_checklist_count
AFTER INSERT OR DELETE OR UPDATE OF completed ON meeting_checklist
FOR EACH ROW EXECUTE FUNCTION update_meeting_checklist_count();

-- 8. VIEW CONSOLIDADA DE REUNIÕES COM CONTADORES
-- ====================================
CREATE OR REPLACE VIEW meetings_with_stats AS
SELECT
  m.*,
  COALESCE(m.image_count, 0) AS images,
  COALESCE(m.checklist_total, 0) AS checklist_items,
  COALESCE(m.checklist_completed, 0) AS checklist_done,
  CASE
    WHEN COALESCE(m.checklist_total, 0) = 0 THEN 0
    ELSE ROUND((m.checklist_completed::NUMERIC / m.checklist_total::NUMERIC) * 100, 2)
  END AS checklist_progress,
  (SELECT COUNT(*) FROM meeting_comments mc WHERE mc.meeting_id = m.id) AS comment_count,
  (SELECT COUNT(*) FROM meeting_attachments ma WHERE ma.meeting_id = m.id) AS attachment_count
FROM meetings m;

-- ====================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ====================================
COMMENT ON TABLE meeting_images IS 'Armazena metadados de imagens anexadas a reuniões';
COMMENT ON TABLE meeting_checklist IS 'Checklist de tarefas associadas a reuniões';
COMMENT ON FUNCTION get_meeting_checklist_progress IS 'Retorna estatísticas de progresso do checklist de uma reunião';
COMMENT ON VIEW meetings_with_stats IS 'View consolidada de reuniões com contadores de imagens, checklist, comentários e anexos';

-- ====================================
-- VERIFICAÇÃO FINAL
-- ====================================
SELECT 'Migration completed successfully!' AS status;
