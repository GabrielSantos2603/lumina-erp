-- ============================================================================
-- LUMINA AI ERP - HUB INTELIGENTE DE REUNIÕES - SETUP PARA SUPABASE
-- ============================================================================
-- Execute este script no SQL Editor do Supabase
-- Sistema SaaS com Row Level Security (RLS)
-- Hub de Acompanhamento por Projeto com IA Conversacional
-- ============================================================================

-- STEP 1: Atualizar tabela meetings existente
DO $$ 
BEGIN
  RAISE NOTICE '🔄 Atualizando tabela meetings...';
  
  -- meeting_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'meeting_type') THEN
    ALTER TABLE meetings ADD COLUMN meeting_type VARCHAR(20) NOT NULL DEFAULT 'briefing';
    ALTER TABLE meetings ADD CONSTRAINT meetings_meeting_type_check CHECK (meeting_type IN ('briefing', 'budget', 'concept', 'presentation', 'revision', 'construction', 'delivery'));
  END IF;

  -- phase
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'phase') THEN
    ALTER TABLE meetings ADD COLUMN phase VARCHAR(20) NOT NULL DEFAULT 'initial';
    ALTER TABLE meetings ADD CONSTRAINT meetings_phase_check CHECK (phase IN ('initial', 'contract', 'design', 'execution', 'construction', 'delivery', 'finished'));
  END IF;

  -- mood
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'mood') THEN
    ALTER TABLE meetings ADD COLUMN mood VARCHAR(20);
    ALTER TABLE meetings ADD CONSTRAINT meetings_mood_check CHECK (mood IN ('positive', 'neutral', 'negative'));
  END IF;

  -- satisfaction_score
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'satisfaction_score') THEN
    ALTER TABLE meetings ADD COLUMN satisfaction_score INTEGER;
    ALTER TABLE meetings ADD CONSTRAINT meetings_satisfaction_score_check CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5);
  END IF;

  -- has_recording
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'has_recording') THEN
    ALTER TABLE meetings ADD COLUMN has_recording BOOLEAN DEFAULT false;
  END IF;

  -- has_transcription
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'has_transcription') THEN
    ALTER TABLE meetings ADD COLUMN has_transcription BOOLEAN DEFAULT false;
  END IF;

  -- audio_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'audio_url') THEN
    ALTER TABLE meetings ADD COLUMN audio_url TEXT;
  END IF;

  -- transcription_summary
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'transcription_summary') THEN
    ALTER TABLE meetings ADD COLUMN transcription_summary JSONB;
  END IF;

  -- estimated_duration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'estimated_duration') THEN
    ALTER TABLE meetings ADD COLUMN estimated_duration INTEGER DEFAULT 60;
  END IF;

  -- actual_duration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'actual_duration') THEN
    ALTER TABLE meetings ADD COLUMN actual_duration INTEGER;
  END IF;

  RAISE NOTICE '✅ Tabela meetings atualizada!';
END $$;

-- Índices para a tabela meetings
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_type ON meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_phase ON meetings(phase);
CREATE INDEX IF NOT EXISTS idx_meetings_has_recording ON meetings(has_recording);
CREATE INDEX IF NOT EXISTS idx_meetings_has_transcription ON meetings(has_transcription);

-- ============================================================================
-- STEP 2: Criar tabelas do Hub de Reuniões
-- ============================================================================

-- Verificar se tabela meetings existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
    RAISE EXCEPTION 'Tabela meetings não existe. Execute primeiro os scripts de criação básica do sistema.';
  END IF;
END $$;

-- TABELA: meeting_agendas
CREATE TABLE IF NOT EXISTS meeting_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  order_index INTEGER NOT NULL DEFAULT 1,
  required BOOLEAN DEFAULT true,
  completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_duration CHECK (duration_minutes > 0),
  CONSTRAINT positive_order CHECK (order_index > 0)
);

-- TABELA: meeting_checklists
CREATE TABLE IF NOT EXISTS meeting_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  text VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Geral',
  required BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: meeting_decisions
CREATE TABLE IF NOT EXISTS meeting_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  description TEXT NOT NULL,
  responsible VARCHAR(255) NOT NULL,
  deadline DATE,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  
  signature_requested BOOLEAN DEFAULT false,
  signature_completed BOOLEAN DEFAULT false,
  signature_date TIMESTAMP WITH TIME ZONE,
  signature_ip VARCHAR(45),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABELA: meeting_attendees
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('architect', 'client', 'engineer', 'contractor', 'supplier', 'team', 'other')),
  confirmed BOOLEAN DEFAULT false,
  attended BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_attendee_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- TABELA: meeting_recordings
CREATE TABLE IF NOT EXISTS meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration_seconds INTEGER,
  mime_type VARCHAR(100) DEFAULT 'audio/webm',
  
  transcription TEXT,
  transcription_status VARCHAR(20) DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_progress INTEGER DEFAULT 0 CHECK (transcription_progress >= 0 AND transcription_progress <= 100),
  
  ai_summary JSONB,
  ai_extracted_decisions JSONB,
  ai_processing_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- STEP 3: Criar índices
-- ============================================================================

-- meeting_agendas
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_meeting_id ON meeting_agendas(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_order ON meeting_agendas(order_index);

-- meeting_checklists  
CREATE INDEX IF NOT EXISTS idx_meeting_checklists_meeting_id ON meeting_checklists(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_checklists_category ON meeting_checklists(category);

-- meeting_decisions
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_meeting_id ON meeting_decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_status ON meeting_decisions(status);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_priority ON meeting_decisions(priority);

-- meeting_attendees
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_role ON meeting_attendees(role);

-- meeting_recordings
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_meeting_id ON meeting_recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_transcription_status ON meeting_recordings(transcription_status);

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
-- STEP 4: Habilitar RLS em todas as tabelas
-- ============================================================================

ALTER TABLE meeting_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ai_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_realtime_transcription ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Criar políticas RLS
-- ============================================================================

-- meeting_agendas
DROP POLICY IF EXISTS "Users can manage own meeting agendas" ON meeting_agendas;
CREATE POLICY "Users can manage own meeting agendas" ON meeting_agendas 
  FOR ALL USING (auth.uid() = user_id);

-- meeting_checklists
DROP POLICY IF EXISTS "Users can manage own meeting checklists" ON meeting_checklists;
CREATE POLICY "Users can manage own meeting checklists" ON meeting_checklists 
  FOR ALL USING (auth.uid() = user_id);

-- meeting_decisions
DROP POLICY IF EXISTS "Users can manage own meeting decisions" ON meeting_decisions;
CREATE POLICY "Users can manage own meeting decisions" ON meeting_decisions 
  FOR ALL USING (auth.uid() = user_id);

-- meeting_attendees
DROP POLICY IF EXISTS "Users can manage own meeting attendees" ON meeting_attendees;
CREATE POLICY "Users can manage own meeting attendees" ON meeting_attendees 
  FOR ALL USING (auth.uid() = user_id);

-- meeting_recordings
DROP POLICY IF EXISTS "Users can manage own meeting recordings" ON meeting_recordings;
CREATE POLICY "Users can manage own meeting recordings" ON meeting_recordings 
  FOR ALL USING (auth.uid() = user_id);

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
-- STEP 6: Criar triggers para updated_at
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_meeting_agendas_updated_at ON meeting_agendas;
CREATE TRIGGER update_meeting_agendas_updated_at 
  BEFORE UPDATE ON meeting_agendas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_checklists_updated_at ON meeting_checklists;
CREATE TRIGGER update_meeting_checklists_updated_at 
  BEFORE UPDATE ON meeting_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_decisions_updated_at ON meeting_decisions;
CREATE TRIGGER update_meeting_decisions_updated_at 
  BEFORE UPDATE ON meeting_decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_attendees_updated_at ON meeting_attendees;
CREATE TRIGGER update_meeting_attendees_updated_at 
  BEFORE UPDATE ON meeting_attendees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_recordings_updated_at ON meeting_recordings;
CREATE TRIGGER update_meeting_recordings_updated_at 
  BEFORE UPDATE ON meeting_recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_files_updated_at ON meeting_files;
CREATE TRIGGER update_meeting_files_updated_at 
  BEFORE UPDATE ON meeting_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_notes_updated_at ON meeting_notes;
CREATE TRIGGER update_meeting_notes_updated_at 
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: Functions auxiliares
-- ============================================================================

-- Calcular progresso e analytics do projeto
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
  
  -- Analytics adicionais
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
  
  SELECT COUNT(*) INTO v_ai_interactions
  FROM project_ai_chat
  WHERE project_id = p_project_id;
  
  SELECT COALESCE(SUM(duration_seconds) / 3600.0, 0) INTO v_transcription_hours
  FROM meeting_recordings mr
  JOIN meetings m ON m.id = mr.meeting_id
  WHERE m.project_id = p_project_id;
  
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

-- Criar reunião completa com agenda e checklist
CREATE OR REPLACE FUNCTION create_complete_meeting(
  p_user_id UUID,
  p_project_id UUID,
  p_meeting_type VARCHAR(20),
  p_title VARCHAR(255),
  p_meeting_date DATE,
  p_start_time TIME,
  p_agenda_items JSONB DEFAULT '[]'::jsonb,
  p_checklist_items JSONB DEFAULT '[]'::jsonb,
  p_attendees JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_meeting_id UUID;
  v_agenda_item RECORD;
  v_checklist_item RECORD;
  v_attendee RECORD;
BEGIN
  -- Criar reunião
  INSERT INTO meetings (
    user_id, project_id, meeting_type, title, meeting_date, start_time, status
  ) VALUES (
    p_user_id, p_project_id, p_meeting_type, p_title, p_meeting_date, p_start_time, 'scheduled'
  ) RETURNING id INTO v_meeting_id;
  
  -- Inserir agenda
  FOR v_agenda_item IN SELECT * FROM jsonb_to_recordset(p_agenda_items) AS x(
    title VARCHAR(255), 
    description TEXT, 
    duration_minutes INTEGER, 
    order_index INTEGER, 
    required BOOLEAN
  ) LOOP
    INSERT INTO meeting_agendas (
      meeting_id, user_id, title, description, duration_minutes, order_index, required
    ) VALUES (
      v_meeting_id, p_user_id, v_agenda_item.title, v_agenda_item.description,
      COALESCE(v_agenda_item.duration_minutes, 15), 
      COALESCE(v_agenda_item.order_index, 1),
      COALESCE(v_agenda_item.required, true)
    );
  END LOOP;
  
  -- Inserir checklist
  FOR v_checklist_item IN SELECT * FROM jsonb_to_recordset(p_checklist_items) AS x(
    text VARCHAR(500), 
    description TEXT, 
    category VARCHAR(100), 
    required BOOLEAN
  ) LOOP
    INSERT INTO meeting_checklists (
      meeting_id, user_id, text, description, category, required
    ) VALUES (
      v_meeting_id, p_user_id, v_checklist_item.text, v_checklist_item.description,
      COALESCE(v_checklist_item.category, 'Geral'),
      COALESCE(v_checklist_item.required, false)
    );
  END LOOP;
  
  -- Inserir participantes
  FOR v_attendee IN SELECT * FROM jsonb_to_recordset(p_attendees) AS x(
    name VARCHAR(255), 
    email VARCHAR(255), 
    role VARCHAR(50)
  ) LOOP
    INSERT INTO meeting_attendees (
      meeting_id, user_id, name, email, role
    ) VALUES (
      v_meeting_id, p_user_id, v_attendee.name, v_attendee.email,
      COALESCE(v_attendee.role, 'other')
    );
  END LOOP;
  
  RETURN v_meeting_id;
END;
$$ LANGUAGE plpgsql;

-- Buscar contexto de projeto para IA
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
      -- Anotações da reunião
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'note', mn.content,
            'type', mn.note_type,
            'timestamp', mn.timestamp_minutes
          )
        ) FILTER (WHERE mn.id IS NOT NULL),
        '[]'::jsonb
      ) as notes,
      -- Decisões da reunião
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'decision', md.description,
            'responsible', md.responsible,
            'status', md.status,
            'priority', md.priority
          )
        ) FILTER (WHERE md.id IS NOT NULL),
        '[]'::jsonb
      ) as decisions,
      -- Transcrição resumida
      mr.transcription,
      mr.ai_summary
    FROM meetings m
    LEFT JOIN meeting_notes mn ON mn.meeting_id = m.id
    LEFT JOIN meeting_decisions md ON md.meeting_id = m.id
    LEFT JOIN meeting_recordings mr ON mr.meeting_id = m.id
    WHERE m.project_id = p_project_id
    GROUP BY m.id, m.title, m.meeting_date, m.meeting_type, m.status, mr.transcription, mr.ai_summary
    ORDER BY m.meeting_date DESC
    LIMIT p_limit
  ),
  project_files AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'file_name', mf.file_name,
          'file_type', mf.file_type,
          'ai_summary', mf.ai_content_summary
        )
      ) as files
    FROM meeting_files mf
    JOIN meetings m ON m.id = mf.meeting_id
    WHERE m.project_id = p_project_id
      AND mf.ai_analyzed = true
  )
  SELECT jsonb_build_object(
    'meetings', COALESCE(jsonb_agg(to_jsonb(rm.*)), '[]'::jsonb),
    'files', COALESCE(pf.files, '[]'::jsonb),
    'analytics', get_project_hub_analytics(p_project_id)
  )
  INTO v_context
  FROM recent_meetings rm
  CROSS JOIN project_files pf;
  
  RETURN v_context;
END;
$$ LANGUAGE plpgsql;

-- Processar transcrição em tempo real
CREATE OR REPLACE FUNCTION process_realtime_transcription(
  p_meeting_id UUID,
  p_user_id UUID,
  p_text_segment TEXT,
  p_timestamp_minutes INTEGER,
  p_speaker VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transcription_id UUID;
  v_ai_actions JSONB DEFAULT '[]'::jsonb;
  v_key_points JSONB DEFAULT '[]'::jsonb;
BEGIN
  -- Inserir segmento
  INSERT INTO meeting_realtime_transcription (
    meeting_id, user_id, text_segment, timestamp_minutes, speaker
  ) VALUES (
    p_meeting_id, p_user_id, p_text_segment, p_timestamp_minutes, p_speaker
  ) RETURNING id INTO v_transcription_id;
  
  -- Análise simples de IA (palavras-chave)
  IF p_text_segment ILIKE '%decisão%' OR p_text_segment ILIKE '%decidir%' THEN
    v_ai_actions := jsonb_build_array(
      jsonb_build_object(
        'type', 'decision',
        'text', p_text_segment,
        'confidence', 0.8
      )
    );
  END IF;
  
  IF p_text_segment ILIKE '%ação%' OR p_text_segment ILIKE '%fazer%' OR p_text_segment ILIKE '%responsável%' THEN
    v_ai_actions := v_ai_actions || jsonb_build_array(
      jsonb_build_object(
        'type', 'action_item',
        'text', p_text_segment,
        'confidence', 0.7
      )
    );
  END IF;
  
  IF p_text_segment ILIKE '%importante%' OR p_text_segment ILIKE '%critical%' OR p_text_segment ILIKE '%urgente%' THEN
    v_key_points := jsonb_build_array(
      jsonb_build_object(
        'type', 'important',
        'text', p_text_segment,
        'confidence', 0.9
      )
    );
  END IF;
  
  -- Atualizar com análise IA
  UPDATE meeting_realtime_transcription 
  SET 
    ai_processed = true,
    ai_action_items = v_ai_actions,
    ai_key_points = v_key_points
  WHERE id = v_transcription_id;
  
  RETURN v_transcription_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: Views consolidadas
-- ============================================================================

-- Dropar views existentes antes de recriar
DROP VIEW IF EXISTS meetings_complete CASCADE;
DROP VIEW IF EXISTS project_timelines CASCADE;

-- View completa de reuniões com Hub
CREATE VIEW meetings_complete AS
SELECT 
  m.*,
  
  -- Contadores agenda
  COALESCE(agenda_stats.total_items, 0) as agenda_items_total,
  COALESCE(agenda_stats.completed_items, 0) as agenda_items_completed,
  
  -- Contadores checklist
  COALESCE(checklist_stats.total_items, 0) as checklist_items_total,
  COALESCE(checklist_stats.completed_items, 0) as checklist_items_completed,
  
  -- Contadores decisões
  COALESCE(decision_stats.total_decisions, 0) as decisions_total,
  COALESCE(decision_stats.pending_decisions, 0) as decisions_pending,
  
  -- Contadores participantes
  COALESCE(attendee_stats.total_attendees, 0) as attendees_total,
  COALESCE(attendee_stats.confirmed_attendees, 0) as attendees_confirmed,
  
  -- Contadores Hub
  COALESCE(files_stats.total_files, 0) as files_total,
  COALESCE(notes_stats.total_notes, 0) as notes_total,
  COALESCE(transcription_stats.segments_count, 0) as transcription_segments,
  
  -- Info gravação
  recording_info.file_url as recording_url,
  recording_info.transcription_status,
  recording_info.ai_summary,
  
  -- Status IA
  CASE 
    WHEN recording_info.transcription_status = 'completed' THEN true
    ELSE false 
  END as has_ai_analysis

FROM meetings m

-- Stats agenda
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE completed = true) as completed_items
  FROM meeting_agendas 
  WHERE meeting_id = m.id
) agenda_stats ON true

-- Stats checklist
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE completed = true) as completed_items
  FROM meeting_checklists 
  WHERE meeting_id = m.id
) checklist_stats ON true

-- Stats decisões
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_decisions,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_decisions
  FROM meeting_decisions 
  WHERE meeting_id = m.id
) decision_stats ON true

-- Stats participantes
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_attendees,
    COUNT(*) FILTER (WHERE confirmed = true) as confirmed_attendees
  FROM meeting_attendees 
  WHERE meeting_id = m.id
) attendee_stats ON true

-- Stats arquivos
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_files
  FROM meeting_files 
  WHERE meeting_id = m.id
) files_stats ON true

-- Stats anotações
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_notes
  FROM meeting_notes 
  WHERE meeting_id = m.id
) notes_stats ON true

-- Stats transcrição em tempo real
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as segments_count
  FROM meeting_realtime_transcription 
  WHERE meeting_id = m.id
) transcription_stats ON true

-- Info gravação
LEFT JOIN LATERAL (
  SELECT 
    file_url,
    transcription_status,
    ai_summary
  FROM meeting_recordings 
  WHERE meeting_id = m.id
  ORDER BY created_at DESC
  LIMIT 1
) recording_info ON true;

-- View Hub completo de projetos
CREATE VIEW project_hub_complete AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.client_name,
  p.start_date,
  p.end_date,
  p.status as project_status,
  
  -- Analytics Hub
  hub_analytics.meetings,
  hub_analytics.content,
  hub_analytics.ai,
  
  -- Próxima reunião
  next_meeting.id as next_meeting_id,
  next_meeting.meeting_type as next_meeting_type,
  next_meeting.meeting_date as next_meeting_date,
  next_meeting.title as next_meeting_title,
  
  -- Última atividade IA
  last_ai_chat.created_at as last_ai_interaction,
  last_ai_chat.message as last_ai_question,
  
  -- Status IA
  CASE 
    WHEN hub_analytics.ai->>'transcription_hours'::text::decimal > 0 THEN true
    ELSE false 
  END as has_ai_content

FROM projects p

-- Analytics Hub
LEFT JOIN LATERAL (
  SELECT * FROM jsonb_to_record(get_project_hub_analytics(p.id)) AS x(
    meetings JSONB,
    content JSONB,
    ai JSONB
  )
) hub_analytics ON true

-- Próxima reunião
LEFT JOIN LATERAL (
  SELECT id, meeting_type, meeting_date, title
  FROM meetings 
  WHERE project_id = p.id 
    AND status = 'scheduled'
    AND meeting_date >= CURRENT_DATE
  ORDER BY meeting_date ASC
  LIMIT 1
) next_meeting ON true

-- Última interação IA
LEFT JOIN LATERAL (
  SELECT created_at, message
  FROM project_ai_chat
  WHERE project_id = p.id
  ORDER BY created_at DESC
  LIMIT 1
) last_ai_chat ON true;

-- ============================================================================
-- STEP 9: Grants e permissões
-- ============================================================================

GRANT ALL ON meeting_agendas TO authenticated;
GRANT ALL ON meeting_checklists TO authenticated;
GRANT ALL ON meeting_decisions TO authenticated;
GRANT ALL ON meeting_attendees TO authenticated;
GRANT ALL ON meeting_recordings TO authenticated;
GRANT ALL ON meeting_files TO authenticated;
GRANT ALL ON meeting_notes TO authenticated;
GRANT ALL ON project_ai_chat TO authenticated;
GRANT ALL ON meeting_realtime_transcription TO authenticated;

GRANT SELECT ON meetings_complete TO authenticated;
GRANT SELECT ON project_hub_complete TO authenticated;

-- ============================================================================
-- STEP 10: Validação final
-- ============================================================================

DO $$ 
DECLARE
  v_test_meeting_id UUID;
BEGIN
  RAISE NOTICE '🧪 Testando configuração...';
  
  -- Teste básico de inserção
  INSERT INTO meeting_agendas (meeting_id, user_id, title) 
  VALUES (gen_random_uuid(), gen_random_uuid(), 'Teste') 
  RETURNING id INTO v_test_meeting_id;
  
  -- Limpar teste
  DELETE FROM meeting_agendas WHERE id = v_test_meeting_id;
  
  RAISE NOTICE '✅ Hub Inteligente de Reuniões configurado com sucesso!';
  RAISE NOTICE '📋 Tabelas principais: meeting_agendas, meeting_checklists, meeting_decisions, meeting_attendees';
  RAISE NOTICE '🤖 Tabelas IA: meeting_recordings, meeting_files, meeting_notes, project_ai_chat, meeting_realtime_transcription';
  RAISE NOTICE '🔒 RLS habilitado em todas as 9 tabelas';
  RAISE NOTICE '📊 Views: meetings_complete, project_hub_complete'; 
  RAISE NOTICE '⚡ Functions: create_complete_meeting, get_project_hub_analytics, get_project_ai_context, process_realtime_transcription';
  RAISE NOTICE '🚀 Sistema Hub pronto para uso!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro na configuração: %', SQLERRM;
END $$;

-- ============================================================================
-- PRÓXIMOS PASSOS
-- ============================================================================

/*
PARA FAZER MANUALMENTE NO SUPABASE:

1. 📁 Storage Bucket:
   - Nome: meeting-recordings
   - Público: false
   - RLS: enabled

2. 🔐 Storage Policies:
   INSERT: (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1])
   SELECT: (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1])

3. 🔗 Edge Functions (opcional):
   - Transcrição com OpenAI Whisper
   - Processamento de IA para decisões
   - Notificações por email

4. 📱 Frontend:
   - Conectar APIs com as novas tabelas
   - Implementar upload de áudio
   - Configurar real-time subscriptions

TESTE AS QUERIES HUB:
-- Ver reuniões completas com analytics
SELECT * FROM meetings_complete WHERE user_id = auth.uid();

-- Ver projetos com Hub analytics
SELECT * FROM project_hub_complete WHERE project_id IN (
  SELECT id FROM projects WHERE user_id = auth.uid()
);

-- Testar contexto IA de um projeto
SELECT get_project_ai_context('seu-project-id'::uuid);

-- Testar analytics Hub
SELECT get_project_hub_analytics('seu-project-id'::uuid);

-- ============================================================================
-- VALIDATION: Verificar se tudo foi criado corretamente
-- ============================================================================

-- Verificar tabelas criadas
SELECT 
  'TABELA' as tipo,
  table_name as nome,
  'CRIADA' as status
FROM information_schema.tables 
WHERE table_name IN ('meeting_agendas', 'meeting_checklists', 'meeting_decisions', 'meeting_attendees', 'meeting_recordings', 'meeting_files', 'meeting_notes', 'project_ai_chat', 'meeting_realtime_transcription')
  AND table_schema = 'public'

UNION ALL

-- Verificar views criadas
SELECT 
  'VIEW' as tipo,
  table_name as nome,
  'CRIADA' as status
FROM information_schema.views 
WHERE table_name IN ('meetings_complete', 'project_hub_complete')
  AND table_schema = 'public'

ORDER BY tipo, nome;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Hub Inteligente de Reuniões configurado com sucesso!';
  RAISE NOTICE '📝 Próximos passos:';
  RAISE NOTICE '1. Use o MESMO bucket "project-files" para arquivos de reunião';
  RAISE NOTICE '2. Configure as APIs OpenAI (Whisper + GPT-4) para IA';
  RAISE NOTICE '3. Implemente transcrição em tempo real no frontend';
  RAISE NOTICE '4. Crie chat IA conversacional por projeto';
  RAISE NOTICE '5. Teste o Hub completo!';
END $$;

*/