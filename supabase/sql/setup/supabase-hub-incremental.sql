-- ============================================================================
-- LUMINA AI ERP - HUB INTELIGENTE - ATUALIZAÇÕES INCREMENTAIS
-- ============================================================================
-- Execute este script APENAS se já executou o supabase-hub-setup.sql antes
-- Contém apenas as novas funcionalidades do Hub Inteligente
-- ============================================================================

-- ============================================================================
-- STEP 1: Verificar se tabelas base existem
-- ============================================================================

DO $$
BEGIN
  -- Verificar se as tabelas principais existem
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Tabela meetings não encontrada. Execute primeiro o script básico de reuniões.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Tabela projects não encontrada. Execute primeiro o script básico de projetos.';
  END IF;
  
  RAISE NOTICE '✅ Tabelas base verificadas com sucesso!';
END $$;

-- ============================================================================
-- STEP 2: Atualizar tabela meetings (apenas novos campos)
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🔄 Verificando campos da tabela meetings...';
  
  -- meeting_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'meeting_type') THEN
    ALTER TABLE meetings ADD COLUMN meeting_type VARCHAR(20) NOT NULL DEFAULT 'briefing';
    ALTER TABLE meetings ADD CONSTRAINT meetings_meeting_type_check CHECK (meeting_type IN ('briefing', 'budget', 'concept', 'presentation', 'revision', 'construction', 'delivery'));
    RAISE NOTICE '✅ Campo meeting_type adicionado';
  END IF;

  -- phase
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'phase') THEN
    ALTER TABLE meetings ADD COLUMN phase VARCHAR(20) NOT NULL DEFAULT 'initial';
    ALTER TABLE meetings ADD CONSTRAINT meetings_phase_check CHECK (phase IN ('initial', 'contract', 'design', 'execution', 'construction', 'delivery', 'finished'));
    RAISE NOTICE '✅ Campo phase adicionado';
  END IF;

  -- mood
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'mood') THEN
    ALTER TABLE meetings ADD COLUMN mood VARCHAR(20);
    ALTER TABLE meetings ADD CONSTRAINT meetings_mood_check CHECK (mood IN ('positive', 'neutral', 'negative'));
    RAISE NOTICE '✅ Campo mood adicionado';
  END IF;

  -- has_recording
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'has_recording') THEN
    ALTER TABLE meetings ADD COLUMN has_recording BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Campo has_recording adicionado';
  END IF;

  -- has_transcription
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'has_transcription') THEN
    ALTER TABLE meetings ADD COLUMN has_transcription BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Campo has_transcription adicionado';
  END IF;

  -- transcription_summary
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'transcription_summary') THEN
    ALTER TABLE meetings ADD COLUMN transcription_summary JSONB;
    RAISE NOTICE '✅ Campo transcription_summary adicionado';
  END IF;

  -- estimated_duration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'estimated_duration') THEN
    ALTER TABLE meetings ADD COLUMN estimated_duration INTEGER DEFAULT 60;
    RAISE NOTICE '✅ Campo estimated_duration adicionado';
  END IF;

  -- actual_duration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'actual_duration') THEN
    ALTER TABLE meetings ADD COLUMN actual_duration INTEGER;
    RAISE NOTICE '✅ Campo actual_duration adicionado';
  END IF;

  RAISE NOTICE '✅ Tabela meetings atualizada!';
END $$;

-- ============================================================================
-- STEP 3: Criar APENAS tabelas Hub que não existem
-- ============================================================================

-- TABELA: meeting_files (integração com bucket de projetos)
CREATE TABLE IF NOT EXISTS meeting_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100),
  
  -- Metadados para IA
  ai_analyzed BOOLEAN DEFAULT false,
  ai_content_summary TEXT,
  ai_extracted_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: meeting_notes (anotações durante reunião)
CREATE TABLE IF NOT EXISTS meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  content TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'general' CHECK (note_type IN ('general', 'action', 'decision', 'question', 'important')),
  timestamp_minutes INTEGER, -- minuto da reunião quando foi anotado
  
  -- IA enriquecimento
  ai_enhanced BOOLEAN DEFAULT false,
  ai_suggestions JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: project_ai_chat (chat inteligente por projeto)
CREATE TABLE IF NOT EXISTS project_ai_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  
  -- Contexto usado pela IA
  context_meetings UUID[] DEFAULT '{}',
  context_files UUID[] DEFAULT '{}',
  context_type VARCHAR(50) DEFAULT 'general',
  
  -- Metadados
  model_used VARCHAR(50) DEFAULT 'gpt-4',
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: meeting_realtime_transcription (transcrição em tempo real)
CREATE TABLE IF NOT EXISTS meeting_realtime_transcription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  text_segment TEXT NOT NULL,
  timestamp_minutes INTEGER NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.95,
  speaker VARCHAR(255),
  
  -- Processamento IA
  ai_processed BOOLEAN DEFAULT false,
  ai_action_items JSONB,
  ai_key_points JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Criar índices apenas se não existem
-- ============================================================================

-- meeting_files
CREATE INDEX IF NOT EXISTS idx_meeting_files_meeting_id ON meeting_files(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_files_project_id ON meeting_files(project_id);
CREATE INDEX IF NOT EXISTS idx_meeting_files_ai_analyzed ON meeting_files(ai_analyzed);

-- meeting_notes
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_type ON meeting_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_timestamp ON meeting_notes(timestamp_minutes);

-- project_ai_chat
CREATE INDEX IF NOT EXISTS idx_project_ai_chat_project_id ON project_ai_chat(project_id);
CREATE INDEX IF NOT EXISTS idx_project_ai_chat_created_at ON project_ai_chat(created_at);

-- meeting_realtime_transcription
CREATE INDEX IF NOT EXISTS idx_meeting_realtime_transcription_meeting_id ON meeting_realtime_transcription(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_realtime_transcription_timestamp ON meeting_realtime_transcription(timestamp_minutes);
CREATE INDEX IF NOT EXISTS idx_meeting_realtime_transcription_ai_processed ON meeting_realtime_transcription(ai_processed);

-- ============================================================================
-- STEP 5: Habilitar RLS nas novas tabelas
-- ============================================================================

ALTER TABLE meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ai_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_realtime_transcription ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Criar políticas RLS para novas tabelas
-- ============================================================================

-- meeting_files
DROP POLICY IF EXISTS "Users can manage own meeting files" ON meeting_files;
CREATE POLICY "Users can manage own meeting files" ON meeting_files 
  FOR ALL USING (auth.uid() = user_id);

-- meeting_notes
DROP POLICY IF EXISTS "Users can manage own meeting notes" ON meeting_notes;
CREATE POLICY "Users can manage own meeting notes" ON meeting_notes 
  FOR ALL USING (auth.uid() = user_id);

-- project_ai_chat
DROP POLICY IF EXISTS "Users can manage own project chat" ON project_ai_chat;
CREATE POLICY "Users can manage own project chat" ON project_ai_chat 
  FOR ALL USING (auth.uid() = user_id);

-- meeting_realtime_transcription
DROP POLICY IF EXISTS "Users can manage own realtime transcription" ON meeting_realtime_transcription;
CREATE POLICY "Users can manage own realtime transcription" ON meeting_realtime_transcription 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 7: Criar triggers para updated_at
-- ============================================================================

-- Verificar se a função existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para novas tabelas
DROP TRIGGER IF EXISTS update_meeting_files_updated_at ON meeting_files;
CREATE TRIGGER update_meeting_files_updated_at 
  BEFORE UPDATE ON meeting_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_notes_updated_at ON meeting_notes;
CREATE TRIGGER update_meeting_notes_updated_at 
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Criar/atualizar functions do Hub
-- ============================================================================

-- Função para analytics do Hub do projeto
CREATE OR REPLACE FUNCTION get_project_hub_analytics(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_meetings INTEGER;
  v_completed_meetings INTEGER;
  v_progress INTEGER;
  v_current_phase VARCHAR(20);
  v_last_meeting_type VARCHAR(20);
  v_total_files INTEGER;
  v_total_notes INTEGER;
  v_total_decisions INTEGER;
  v_pending_decisions INTEGER;
  v_ai_interactions INTEGER;
  v_transcription_hours DECIMAL;
BEGIN
  -- Contar reuniões
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_meetings, v_completed_meetings
  FROM meetings 
  WHERE project_id = p_project_id;
  
  -- Calcular progresso
  v_progress := CASE 
    WHEN v_total_meetings = 0 THEN 0
    ELSE ROUND((v_completed_meetings::DECIMAL / v_total_meetings) * 100)
  END;
  
  -- Determinar fase atual
  SELECT meeting_type 
  INTO v_last_meeting_type
  FROM meetings 
  WHERE project_id = p_project_id 
    AND status = 'completed'
  ORDER BY meeting_date DESC, created_at DESC 
  LIMIT 1;
  
  v_current_phase := CASE v_last_meeting_type
    WHEN 'briefing' THEN 'contract'
    WHEN 'budget' THEN 'design'
    WHEN 'concept' THEN 'design'
    WHEN 'presentation' THEN 'execution'
    WHEN 'revision' THEN 'execution'
    WHEN 'construction' THEN 'delivery'
    WHEN 'delivery' THEN 'finished'
    ELSE 'initial'
  END;
  
  -- Analytics adicionais (verificar se tabelas existem)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_files') THEN
    SELECT COUNT(*) INTO v_total_files
    FROM meeting_files mf
    JOIN meetings m ON m.id = mf.meeting_id
    WHERE m.project_id = p_project_id;
  ELSE
    v_total_files := 0;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_notes') THEN
    SELECT COUNT(*) INTO v_total_notes
    FROM meeting_notes mn
    JOIN meetings m ON m.id = mn.meeting_id
    WHERE m.project_id = p_project_id;
  ELSE
    v_total_notes := 0;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_decisions') THEN
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE status = 'pending')
    INTO v_total_decisions, v_pending_decisions
    FROM meeting_decisions md
    JOIN meetings m ON m.id = md.meeting_id
    WHERE m.project_id = p_project_id;
  ELSE
    v_total_decisions := 0;
    v_pending_decisions := 0;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_ai_chat') THEN
    SELECT COUNT(*) INTO v_ai_interactions
    FROM project_ai_chat
    WHERE project_id = p_project_id;
  ELSE
    v_ai_interactions := 0;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_recordings') THEN
    SELECT COALESCE(SUM(duration_seconds) / 3600.0, 0) INTO v_transcription_hours
    FROM meeting_recordings mr
    JOIN meetings m ON m.id = mr.meeting_id
    WHERE m.project_id = p_project_id;
  ELSE
    v_transcription_hours := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'meetings', jsonb_build_object(
      'total', v_total_meetings,
      'completed', v_completed_meetings,
      'progress', v_progress,
      'current_phase', v_current_phase,
      'last_meeting_type', COALESCE(v_last_meeting_type, 'none')
    ),
    'content', jsonb_build_object(
      'files', v_total_files,
      'notes', v_total_notes,
      'decisions_total', v_total_decisions,
      'decisions_pending', v_pending_decisions
    ),
    'ai', jsonb_build_object(
      'interactions', v_ai_interactions,
      'transcription_hours', v_transcription_hours
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Função para contexto de IA
CREATE OR REPLACE FUNCTION get_project_ai_context(p_project_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS JSONB AS $$
DECLARE
  v_context JSONB;
BEGIN
  WITH recent_meetings AS (
    SELECT 
      m.id,
      m.title,
      m.meeting_date,
      m.meeting_type,
      m.status,
      -- Transcrição resumida (se existir)
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_recordings') 
        THEN (SELECT transcription FROM meeting_recordings WHERE meeting_id = m.id LIMIT 1)
        ELSE NULL 
      END as transcription
    FROM meetings m
    WHERE m.project_id = p_project_id
    ORDER BY m.meeting_date DESC
    LIMIT p_limit
  )
  SELECT jsonb_build_object(
    'meetings', COALESCE(jsonb_agg(to_jsonb(rm.*)), '[]'::jsonb),
    'analytics', get_project_hub_analytics(p_project_id)
  )
  INTO v_context
  FROM recent_meetings rm;
  
  RETURN v_context;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: Atualizar/criar views (apenas se não causem conflito)
-- ============================================================================

-- Tentar recriar view meetings_complete de forma segura
DO $$
BEGIN
  -- Dropar view se existir
  DROP VIEW IF EXISTS meetings_complete CASCADE;
  
  -- Recriar com novos campos
  CREATE VIEW meetings_complete AS
  SELECT 
    m.*,
    
    -- Contadores Hub (verificar se tabelas existem)
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_files') 
      THEN (SELECT COUNT(*) FROM meeting_files WHERE meeting_id = m.id)
      ELSE 0 
    END as files_total,
    
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_notes') 
      THEN (SELECT COUNT(*) FROM meeting_notes WHERE meeting_id = m.id)
      ELSE 0 
    END as notes_total,
    
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_realtime_transcription') 
      THEN (SELECT COUNT(*) FROM meeting_realtime_transcription WHERE meeting_id = m.id)
      ELSE 0 
    END as transcription_segments,
    
    -- Status IA
    COALESCE(m.has_transcription, false) as has_ai_analysis
    
  FROM meetings m;

  RAISE NOTICE '✅ View meetings_complete atualizada';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro ao atualizar view meetings_complete: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 10: Grants e permissões
-- ============================================================================

GRANT ALL ON meeting_files TO authenticated;
GRANT ALL ON meeting_notes TO authenticated;
GRANT ALL ON project_ai_chat TO authenticated;
GRANT ALL ON meeting_realtime_transcription TO authenticated;

-- ============================================================================
-- STEP 11: Validação final
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🧪 Validando atualizações...';
  
  -- Verificar novas tabelas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_files') THEN
    RAISE NOTICE '✅ Tabela meeting_files criada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_notes') THEN
    RAISE NOTICE '✅ Tabela meeting_notes criada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_ai_chat') THEN
    RAISE NOTICE '✅ Tabela project_ai_chat criada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_realtime_transcription') THEN
    RAISE NOTICE '✅ Tabela meeting_realtime_transcription criada';
  END IF;
  
  RAISE NOTICE '🚀 Hub Inteligente - Atualizações incrementais concluídas!';
  RAISE NOTICE '📋 Novas tabelas: meeting_files, meeting_notes, project_ai_chat, meeting_realtime_transcription';
  RAISE NOTICE '⚡ Functions: get_project_hub_analytics, get_project_ai_context';
  RAISE NOTICE '🔒 RLS habilitado em todas as novas tabelas';
  RAISE NOTICE '✨ Sistema Hub pronto para uso!';
  
END $$;

-- ============================================================================
-- PRÓXIMOS PASSOS
-- ============================================================================

/*
CONFIGURAÇÕES MANUAIS NECESSÁRIAS:

1. ✅ Storage: Usar bucket 'project-files' existente
   - Estrutura: user_id/project_id/meetings/meeting_id/arquivo.ext

2. 🔗 APIs IA (implementar no frontend):
   - OpenAI Whisper: transcrição em tempo real
   - GPT-4: chat conversacional por projeto
   - Análise de arquivos: PDFs, DOCs, imagens

3. 🧪 Testes:
   - Criar reunião nova
   - Upload arquivo durante reunião
   - Chat IA sobre projeto
   - Verificar analytics atualizando

QUERIES DE TESTE:
SELECT get_project_hub_analytics('seu-project-id'::uuid);
SELECT * FROM meetings_complete LIMIT 5;
SELECT * FROM meeting_files LIMIT 5;
*/