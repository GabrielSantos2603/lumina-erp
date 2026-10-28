-- =========================================
-- MIGRATION CONSOLIDADA: Meetings + Atas
-- Execute este arquivo se a tabela meetings ainda não existe
-- OU se você quer recriar tudo do zero
-- =========================================

-- ================================================
-- PARTE 1: CRIAR TABELA MEETINGS (se não existir)
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

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);

-- RLS básico
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;

CREATE POLICY "Users can view own meetings" ON meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create meetings" ON meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meetings" ON meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meetings" ON meetings FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- PARTE 2: ADICIONAR CAMPOS DE ATAS
-- ================================================

-- Add new columns for minutes management
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS minutes_status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS ai_summary JSONB,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS template_type VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_meetings_tags ON meetings USING GIN(tags);

-- Create index for minutes_status
CREATE INDEX IF NOT EXISTS idx_meetings_minutes_status ON meetings(minutes_status);

-- Create index for template_type
CREATE INDEX IF NOT EXISTS idx_meetings_template_type ON meetings(template_type);

-- Add check constraint for minutes_status
ALTER TABLE meetings 
DROP CONSTRAINT IF EXISTS meetings_minutes_status_check;

ALTER TABLE meetings
ADD CONSTRAINT meetings_minutes_status_check 
CHECK (minutes_status IN ('draft', 'in_review', 'approved', 'archived'));

-- Add check constraint for template_type
ALTER TABLE meetings 
DROP CONSTRAINT IF EXISTS meetings_template_type_check;

ALTER TABLE meetings
ADD CONSTRAINT meetings_template_type_check 
CHECK (template_type IN ('standard', 'formal', 'informal', 'technical', 'board'));

-- ================================================
-- PARTE 3: TRIGGER AUTO-UPDATE APPROVED_AT
-- ================================================

CREATE OR REPLACE FUNCTION update_meeting_approved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.minutes_status = 'approved' AND OLD.minutes_status != 'approved' THEN
        NEW.approved_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_meeting_approved_at ON meetings;

CREATE TRIGGER trigger_update_meeting_approved_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_meeting_approved_at();

-- ================================================
-- PARTE 4: MEETING VERSIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS meeting_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    transcription TEXT,
    ai_summary JSONB,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    change_summary TEXT,
    UNIQUE(meeting_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_meeting_versions_meeting_id ON meeting_versions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_versions_created_at ON meeting_versions(created_at DESC);

ALTER TABLE meeting_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting versions" ON meeting_versions;
DROP POLICY IF EXISTS "Users can create meeting versions" ON meeting_versions;

CREATE POLICY "Users can view meeting versions"
    ON meeting_versions FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create meeting versions"
    ON meeting_versions FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- ================================================
-- PARTE 5: MEETING APPROVALS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS meeting_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    comments TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_approvals_meeting_id ON meeting_approvals(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_approvals_approver_id ON meeting_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_meeting_approvals_status ON meeting_approvals(status);

ALTER TABLE meeting_approvals
DROP CONSTRAINT IF EXISTS meeting_approvals_status_check;

ALTER TABLE meeting_approvals
ADD CONSTRAINT meeting_approvals_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE meeting_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting approvals" ON meeting_approvals;
DROP POLICY IF EXISTS "Approvers can update their approvals" ON meeting_approvals;
DROP POLICY IF EXISTS "Users can create meeting approvals" ON meeting_approvals;

CREATE POLICY "Users can view meeting approvals"
    ON meeting_approvals FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Approvers can update their approvals"
    ON meeting_approvals FOR UPDATE
    USING (auth.uid() = approver_id);

CREATE POLICY "Users can create meeting approvals"
    ON meeting_approvals FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ================================================
-- PARTE 6: MEETING COMMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS meeting_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_comments_meeting_id ON meeting_comments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_comments_created_at ON meeting_comments(created_at DESC);

ALTER TABLE meeting_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting comments" ON meeting_comments;
DROP POLICY IF EXISTS "Users can create meeting comments" ON meeting_comments;
DROP POLICY IF EXISTS "Users can delete own meeting comments" ON meeting_comments;

CREATE POLICY "Users can view meeting comments"
    ON meeting_comments FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create meeting comments"
    ON meeting_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meeting comments"
    ON meeting_comments FOR DELETE
    USING (auth.uid() = user_id);

-- ================================================
-- PARTE 7: MEETING ATTACHMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS meeting_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_attachments_meeting_id ON meeting_attachments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attachments_created_at ON meeting_attachments(created_at DESC);

ALTER TABLE meeting_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting attachments" ON meeting_attachments;
DROP POLICY IF EXISTS "Users can create meeting attachments" ON meeting_attachments;
DROP POLICY IF EXISTS "Users can delete own meeting attachments" ON meeting_attachments;

CREATE POLICY "Users can view meeting attachments"
    ON meeting_attachments FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create meeting attachments"
    ON meeting_attachments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meeting attachments"
    ON meeting_attachments FOR DELETE
    USING (auth.uid() = user_id);

-- ================================================
-- PARTE 8: HELPER FUNCTIONS
-- ================================================

CREATE OR REPLACE FUNCTION get_meeting_approval_status(p_meeting_id UUID)
RETURNS TABLE (
    total_approvers INTEGER,
    approved_count INTEGER,
    rejected_count INTEGER,
    pending_count INTEGER,
    all_approved BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_approvers,
        COUNT(*) FILTER (WHERE status = 'approved')::INTEGER as approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER as rejected_count,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
        BOOL_AND(status = 'approved') as all_approved
    FROM meeting_approvals
    WHERE meeting_id = p_meeting_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_meeting_version(
    p_meeting_id UUID,
    p_created_by UUID,
    p_change_summary TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_version_number INTEGER;
    v_version_id UUID;
    v_meeting RECORD;
BEGIN
    SELECT * INTO v_meeting FROM meetings WHERE id = p_meeting_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Meeting not found';
    END IF;
    
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM meeting_versions
    WHERE meeting_id = p_meeting_id;
    
    INSERT INTO meeting_versions (
        meeting_id,
        version_number,
        transcription,
        ai_summary,
        notes,
        created_by,
        change_summary
    ) VALUES (
        p_meeting_id,
        v_version_number,
        v_meeting.transcription,
        v_meeting.ai_summary,
        v_meeting.description,
        p_created_by,
        p_change_summary
    )
    RETURNING id INTO v_version_id;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- PARTE 9: VIEWS
-- ================================================

CREATE OR REPLACE VIEW meetings_with_approval_status AS
SELECT 
    m.*,
    COALESCE(a.total_approvers, 0) as total_approvers,
    COALESCE(a.approved_count, 0) as approved_count,
    COALESCE(a.rejected_count, 0) as rejected_count,
    COALESCE(a.pending_count, 0) as pending_count,
    COALESCE(a.all_approved, false) as all_approved
FROM meetings m
LEFT JOIN LATERAL (
    SELECT * FROM get_meeting_approval_status(m.id)
) a ON true;

GRANT SELECT ON meetings_with_approval_status TO authenticated;

-- ================================================
-- PARTE 10: COMENTÁRIOS
-- ================================================

COMMENT ON TABLE meetings IS 'Reuniões e atas de reunião com recursos de IA';
COMMENT ON COLUMN meetings.minutes_status IS 'Status da ata: draft, in_review, approved, archived';
COMMENT ON COLUMN meetings.transcription IS 'Transcrição de áudio gerada por IA (Whisper)';
COMMENT ON COLUMN meetings.ai_summary IS 'Resumo estruturado gerado por IA';
COMMENT ON COLUMN meetings.tags IS 'Tags para organização e busca';
COMMENT ON COLUMN meetings.template_type IS 'Tipo de template: standard, formal, informal, technical, board';
COMMENT ON COLUMN meetings.approval_required IS 'Requer aprovação formal';
COMMENT ON COLUMN meetings.approved_by IS 'Usuário que aprovouou (aprovação simples)';
COMMENT ON COLUMN meetings.approved_at IS 'Timestamp de aprovação';

COMMENT ON TABLE meeting_versions IS 'Histórico de versões das atas';
COMMENT ON TABLE meeting_approvals IS 'Workflow de aprovação multi-stakeholder';
COMMENT ON TABLE meeting_comments IS 'Comentários nas reuniões';
COMMENT ON TABLE meeting_attachments IS 'Anexos das reuniões';

-- ================================================
-- FIM DA MIGRATION
-- ================================================

-- Teste de validação
DO $$
DECLARE
    v_meeting_id UUID;
BEGIN
    -- Tentar criar uma reunião de teste
    INSERT INTO meetings (
        user_id,
        title,
        meeting_date,
        start_time,
        minutes_status,
        tags,
        template_type
    ) VALUES (
        auth.uid(),
        'Teste Migration Consolidada',
        CURRENT_DATE,
        '10:00',
        'draft',
        ARRAY['teste', 'migration'],
        'standard'
    ) RETURNING id INTO v_meeting_id;
    
    RAISE NOTICE '✅ Migration concluída com sucesso!';
    RAISE NOTICE '✅ Reunião de teste criada: %', v_meeting_id;
    
    -- Limpar teste
    DELETE FROM meetings WHERE id = v_meeting_id;
    
    RAISE NOTICE '✅ Sistema pronto para uso!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na migration: % - %', SQLSTATE, SQLERRM;
        RAISE;
END $$;
