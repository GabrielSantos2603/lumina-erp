-- ============================================================================
-- LUMINA AI ERP - HUB INTELIGENTE - SCRIPT COMPLETO ATUALIZADO
-- ============================================================================
-- Versão: 2.0 - Com correções de integração de IA
-- Execute este script para corrigir problemas de integração identificados
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
-- STEP 2: Atualizar tabela meetings com novos campos
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

  -- 🚨 NOVOS CAMPOS PARA ATA FINAL
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'ata_status') THEN
    ALTER TABLE meetings ADD COLUMN ata_status VARCHAR(20) DEFAULT 'draft';
    ALTER TABLE meetings ADD CONSTRAINT meetings_ata_status_check CHECK (ata_status IN ('draft', 'in_progress', 'completed', 'approved', 'archived'));
    RAISE NOTICE '✅ Campo ata_status adicionado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'ata_final_content') THEN
    ALTER TABLE meetings ADD COLUMN ata_final_content JSONB;
    RAISE NOTICE '✅ Campo ata_final_content adicionado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'ata_generated_at') THEN
    ALTER TABLE meetings ADD COLUMN ata_generated_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Campo ata_generated_at adicionado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'ata_approved_by') THEN
    ALTER TABLE meetings ADD COLUMN ata_approved_by UUID;
    RAISE NOTICE '✅ Campo ata_approved_by adicionado';
  END IF;

  RAISE NOTICE '✅ Tabela meetings atualizada com campos de ata!';
END $$;

-- ============================================================================
-- STEP 3: Criar TODAS as tabelas necessárias
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

-- 🚨 NOVA TABELA: meeting_ai_analysis (análise completa da reunião)
CREATE TABLE IF NOT EXISTS meeting_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Dados da análise
  full_analysis JSONB NOT NULL,
  summary TEXT,
  mood VARCHAR(20) CHECK (mood IN ('positive', 'neutral', 'negative')),
  duration_minutes INTEGER,
  
  -- Estatísticas
  total_segments INTEGER DEFAULT 0,
  total_decisions INTEGER DEFAULT 0,
  total_action_items INTEGER DEFAULT 0,
  total_key_points INTEGER DEFAULT 0,
  total_concerns INTEGER DEFAULT 0,
  
  -- Metadados IA
  ai_model VARCHAR(50) DEFAULT 'gpt-4',
  confidence_score DECIMAL(3,2) DEFAULT 0.90,
  processing_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🚨 NOVA TABELA: meeting_decisions (decisões identificadas)
CREATE TABLE IF NOT EXISTS meeting_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  decision TEXT NOT NULL,
  responsible VARCHAR(255),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  timestamp_minutes INTEGER,
  
  -- Status de acompanhamento
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🚨 NOVA TABELA: meeting_action_items (itens de ação)
CREATE TABLE IF NOT EXISTS meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  action TEXT NOT NULL,
  responsible VARCHAR(255),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  
  -- Status de acompanhamento
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  timestamp_minutes INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🚨 NOVA TABELA: meeting_insights (insights identificados pela IA)
CREATE TABLE IF NOT EXISTS meeting_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  type VARCHAR(20) NOT NULL CHECK (type IN ('key_point', 'concern', 'suggestion', 'risk', 'opportunity')),
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.90,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  timestamp_minutes INTEGER,
  
  -- Categorização
  category VARCHAR(50), -- projeto, técnico, financeiro, etc
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3.5: Adicionar foreign keys após criação das tabelas
-- ============================================================================

-- Adicionar foreign keys para analysis_id depois que meeting_ai_analysis existe
DO $$
BEGIN
  -- Verificar e adicionar coluna analysis_id se não existir, depois FK para meeting_decisions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_decisions' AND column_name = 'analysis_id') THEN
    ALTER TABLE meeting_decisions ADD COLUMN analysis_id UUID;
    RAISE NOTICE '✅ Coluna analysis_id adicionada em meeting_decisions';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'meeting_decisions' AND constraint_name = 'meeting_decisions_analysis_id_fkey'
  ) THEN
    ALTER TABLE meeting_decisions 
    ADD CONSTRAINT meeting_decisions_analysis_id_fkey 
    FOREIGN KEY (analysis_id) REFERENCES meeting_ai_analysis(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ FK analysis_id adicionada em meeting_decisions';
  END IF;

  -- Verificar e adicionar coluna analysis_id se não existir, depois FK para meeting_action_items
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_action_items' AND column_name = 'analysis_id') THEN
    ALTER TABLE meeting_action_items ADD COLUMN analysis_id UUID;
    RAISE NOTICE '✅ Coluna analysis_id adicionada em meeting_action_items';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'meeting_action_items' AND constraint_name = 'meeting_action_items_analysis_id_fkey'
  ) THEN
    ALTER TABLE meeting_action_items 
    ADD CONSTRAINT meeting_action_items_analysis_id_fkey 
    FOREIGN KEY (analysis_id) REFERENCES meeting_ai_analysis(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ FK analysis_id adicionada em meeting_action_items';
  END IF;

  -- Verificar e adicionar coluna analysis_id se não existir, depois FK para meeting_insights
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_insights' AND column_name = 'analysis_id') THEN
    ALTER TABLE meeting_insights ADD COLUMN analysis_id UUID;
    RAISE NOTICE '✅ Coluna analysis_id adicionada em meeting_insights';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'meeting_insights' AND constraint_name = 'meeting_insights_analysis_id_fkey'
  ) THEN
    ALTER TABLE meeting_insights 
    ADD CONSTRAINT meeting_insights_analysis_id_fkey 
    FOREIGN KEY (analysis_id) REFERENCES meeting_ai_analysis(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ FK analysis_id adicionada em meeting_insights';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Criar índices para performance
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

-- 🚨 NOVOS ÍNDICES para análises de IA
CREATE INDEX IF NOT EXISTS idx_meeting_ai_analysis_meeting_id ON meeting_ai_analysis(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_ai_analysis_created_at ON meeting_ai_analysis(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_decisions_meeting_id ON meeting_decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_analysis_id ON meeting_decisions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_status ON meeting_decisions(status);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_priority ON meeting_decisions(priority);

CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting_id ON meeting_action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_analysis_id ON meeting_action_items(analysis_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_completed ON meeting_action_items(completed);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_priority ON meeting_action_items(priority);

CREATE INDEX IF NOT EXISTS idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_type ON meeting_insights(type);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_priority ON meeting_insights(priority);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_tags ON meeting_insights USING GIN(tags);

-- Índices para status de ata
CREATE INDEX IF NOT EXISTS idx_meetings_ata_status ON meetings(ata_status);
CREATE INDEX IF NOT EXISTS idx_meetings_ata_generated_at ON meetings(ata_generated_at DESC);

-- ============================================================================
-- STEP 6: Habilitar RLS em todas as tabelas
-- ============================================================================

ALTER TABLE meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ai_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_realtime_transcription ENABLE ROW LEVEL SECURITY;

-- 🚨 NOVAS TABELAS
ALTER TABLE meeting_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_insights ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Criar políticas RLS
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

-- 🚨 POLÍTICAS PARA NOVAS TABELAS
DROP POLICY IF EXISTS "Users can manage own meeting analysis" ON meeting_ai_analysis;
CREATE POLICY "Users can manage own meeting analysis" ON meeting_ai_analysis 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own meeting decisions" ON meeting_decisions;
CREATE POLICY "Users can manage own meeting decisions" ON meeting_decisions 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own meeting action items" ON meeting_action_items;
CREATE POLICY "Users can manage own meeting action items" ON meeting_action_items 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own meeting insights" ON meeting_insights;
CREATE POLICY "Users can manage own meeting insights" ON meeting_insights 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 8: Criar triggers para updated_at
-- ============================================================================

-- Verificar se a função existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tabelas com updated_at
DROP TRIGGER IF EXISTS update_meeting_files_updated_at ON meeting_files;
CREATE TRIGGER update_meeting_files_updated_at 
  BEFORE UPDATE ON meeting_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_notes_updated_at ON meeting_notes;
CREATE TRIGGER update_meeting_notes_updated_at 
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🚨 NOVOS TRIGGERS
DROP TRIGGER IF EXISTS update_meeting_ai_analysis_updated_at ON meeting_ai_analysis;
CREATE TRIGGER update_meeting_ai_analysis_updated_at 
  BEFORE UPDATE ON meeting_ai_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_decisions_updated_at ON meeting_decisions;
CREATE TRIGGER update_meeting_decisions_updated_at 
  BEFORE UPDATE ON meeting_decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_action_items_updated_at ON meeting_action_items;
CREATE TRIGGER update_meeting_action_items_updated_at 
  BEFORE UPDATE ON meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: Funções especializadas para IA
-- ============================================================================

-- Função para salvar análise completa de reunião
CREATE OR REPLACE FUNCTION save_meeting_analysis(
  p_meeting_id UUID,
  p_user_id UUID,
  p_analysis JSONB,
  p_summary TEXT DEFAULT NULL,
  p_mood VARCHAR(20) DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_analysis_id UUID;
  v_decision JSONB;
  v_action JSONB;
  v_insight JSONB;
BEGIN
  -- Inserir análise principal
  INSERT INTO meeting_ai_analysis (
    meeting_id,
    user_id,
    full_analysis,
    summary,
    mood,
    duration_minutes,
    total_decisions,
    total_action_items,
    total_key_points,
    total_concerns
  ) VALUES (
    p_meeting_id,
    p_user_id,
    p_analysis,
    p_summary,
    p_mood,
    p_duration_minutes,
    COALESCE(jsonb_array_length(p_analysis->'decisions'), 0),
    COALESCE(jsonb_array_length(p_analysis->'actionItems'), 0),
    COALESCE(jsonb_array_length(p_analysis->'keyPoints'), 0),
    COALESCE(jsonb_array_length(p_analysis->'concerns'), 0)
  ) RETURNING id INTO v_analysis_id;
  
  -- Inserir decisões
  IF p_analysis->'decisions' IS NOT NULL THEN
    FOR v_decision IN SELECT jsonb_array_elements(p_analysis->'decisions')
    LOOP
      INSERT INTO meeting_decisions (
        meeting_id, analysis_id, user_id, decision, responsible, priority, timestamp_minutes
      ) VALUES (
        p_meeting_id, v_analysis_id, p_user_id,
        v_decision->>'decision',
        v_decision->>'responsible',
        v_decision->>'priority',
        (v_decision->>'timestamp')::INTEGER
      );
    END LOOP;
  END IF;
  
  -- Inserir ações
  IF p_analysis->'actionItems' IS NOT NULL THEN
    FOR v_action IN SELECT jsonb_array_elements(p_analysis->'actionItems')
    LOOP
      INSERT INTO meeting_action_items (
        meeting_id, analysis_id, user_id, action, responsible, priority, timestamp_minutes
      ) VALUES (
        p_meeting_id, v_analysis_id, p_user_id,
        v_action->>'action',
        v_action->>'responsible',
        v_action->>'priority',
        (v_action->>'timestamp')::INTEGER
      );
    END LOOP;
  END IF;
  
  -- Inserir insights (key points + concerns)
  IF p_analysis->'keyPoints' IS NOT NULL THEN
    FOR v_insight IN SELECT jsonb_array_elements(p_analysis->'keyPoints')
    LOOP
      INSERT INTO meeting_insights (
        meeting_id, analysis_id, user_id, type, content, timestamp_minutes
      ) VALUES (
        p_meeting_id, v_analysis_id, p_user_id, 'key_point', v_insight::text,
        COALESCE((v_insight->>'timestamp')::INTEGER, 0)
      );
    END LOOP;
  END IF;
  
  IF p_analysis->'concerns' IS NOT NULL THEN
    FOR v_insight IN SELECT jsonb_array_elements(p_analysis->'concerns')
    LOOP
      INSERT INTO meeting_insights (
        meeting_id, analysis_id, user_id, type, content, priority
      ) VALUES (
        p_meeting_id, v_analysis_id, p_user_id, 'concern', v_insight::text, 'high'
      );
    END LOOP;
  END IF;
  
  -- Atualizar reunião
  UPDATE meetings SET 
    has_transcription = true,
    ata_status = 'completed',
    ata_generated_at = NOW()
  WHERE id = p_meeting_id;
  
  RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql;

-- Função para analytics do Hub do projeto (atualizada)
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
  v_total_action_items INTEGER;
  v_pending_action_items INTEGER;
  v_ai_interactions INTEGER;
  v_transcription_hours DECIMAL;
  v_total_analyses INTEGER;
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
  
  -- Analytics detalhados
  SELECT COUNT(*) INTO v_total_files
  FROM meeting_files mf
  JOIN meetings m ON m.id = mf.meeting_id
  WHERE m.project_id = p_project_id;
  
  SELECT COUNT(*) INTO v_total_notes
  FROM meeting_notes mn
  JOIN meetings m ON m.id = mn.meeting_id
  WHERE m.project_id = p_project_id;
  
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending')
  INTO v_total_decisions, v_pending_decisions
  FROM meeting_decisions md
  JOIN meetings m ON m.id = md.meeting_id
  WHERE m.project_id = p_project_id;
  
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = false)
  INTO v_total_action_items, v_pending_action_items
  FROM meeting_action_items mai
  JOIN meetings m ON m.id = mai.meeting_id
  WHERE m.project_id = p_project_id;
  
  SELECT COUNT(*) INTO v_ai_interactions
  FROM project_ai_chat
  WHERE project_id = p_project_id;
  
  SELECT COUNT(*) INTO v_total_analyses
  FROM meeting_ai_analysis maa
  JOIN meetings m ON m.id = maa.meeting_id
  WHERE m.project_id = p_project_id;
  
  -- Calcular horas de transcrição
  SELECT COALESCE(SUM(actual_duration) / 60.0, 0) INTO v_transcription_hours
  FROM meetings
  WHERE project_id = p_project_id 
    AND has_transcription = true;
  
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
      'decisions_pending', v_pending_decisions,
      'action_items_total', v_total_action_items,
      'action_items_pending', v_pending_action_items
    ),
    'ai', jsonb_build_object(
      'interactions', v_ai_interactions,
      'analyses', v_total_analyses,
      'transcription_hours', v_transcription_hours
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: Grants e permissões
-- ============================================================================

GRANT ALL ON meeting_files TO authenticated;
GRANT ALL ON meeting_notes TO authenticated;
GRANT ALL ON project_ai_chat TO authenticated;
GRANT ALL ON meeting_realtime_transcription TO authenticated;

-- 🚨 NOVAS TABELAS
GRANT ALL ON meeting_ai_analysis TO authenticated;
GRANT ALL ON meeting_decisions TO authenticated;
GRANT ALL ON meeting_action_items TO authenticated;
GRANT ALL ON meeting_insights TO authenticated;

-- ============================================================================
-- STEP 11: Validação final
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🧪 Validando todas as tabelas...';
  
  -- Verificar tabelas básicas
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
  
  -- Verificar novas tabelas de IA
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_ai_analysis') THEN
    RAISE NOTICE '✅ Tabela meeting_ai_analysis criada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_decisions') THEN
    RAISE NOTICE '✅ Tabela meeting_decisions criada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_action_items') THEN
    RAISE NOTICE '✅ Tabela meeting_action_items criada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_insights') THEN
    RAISE NOTICE '✅ Tabela meeting_insights criada';
  END IF;
  
  -- Verificar novos campos
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'ata_status') THEN
    RAISE NOTICE '✅ Campo ata_status na tabela meetings';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'ata_final_content') THEN
    RAISE NOTICE '✅ Campo ata_final_content na tabela meetings';
  END IF;
  
  RAISE NOTICE '🚀 Hub Inteligente - VERSÃO 2.0 instalado com sucesso!';
  RAISE NOTICE '📊 Novas funcionalidades:';
  RAISE NOTICE '   • Análise completa de IA para reuniões';
  RAISE NOTICE '   • Rastreamento de decisões e ações';
  RAISE NOTICE '   • Sistema de insights automatizado';
  RAISE NOTICE '   • Status de atas com aprovação';
  RAISE NOTICE '   • Análise de sentimentos de reuniões';
  RAISE NOTICE '🔧 Função save_meeting_analysis() disponível';
  RAISE NOTICE '📈 Analytics aprimorado com get_project_hub_analytics()';
  RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
  RAISE NOTICE '✨ Sistema completamente preparado para IA!';
  
END $$;

-- ============================================================================
-- QUERIES DE TESTE RECOMENDADAS
-- ============================================================================

/*
-- Testar analytics
SELECT get_project_hub_analytics('seu-project-id'::uuid);

-- Testar salvamento de análise
SELECT save_meeting_analysis(
  'meeting-id'::uuid, 
  auth.uid(), 
  '{"decisions": [], "actionItems": [], "keyPoints": [], "concerns": []}'::jsonb,
  'Reunião de teste',
  'positive',
  60
);

-- Ver estrutura das novas tabelas
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'meeting_ai_analysis' ORDER BY ordinal_position;

-- Contar registros
SELECT 
  'meeting_files' as tabela, COUNT(*) as registros FROM meeting_files
UNION ALL
SELECT 'meeting_notes', COUNT(*) FROM meeting_notes
UNION ALL  
SELECT 'meeting_ai_analysis', COUNT(*) FROM meeting_ai_analysis
UNION ALL
SELECT 'meeting_decisions', COUNT(*) FROM meeting_decisions
UNION ALL
SELECT 'meeting_action_items', COUNT(*) FROM meeting_action_items;
*/