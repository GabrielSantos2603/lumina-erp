-- ================================================================
-- LUMINA AI ERP - HUB DE REUNIÕES INTELIGENTE - MIGRATION COMPLETA
-- ================================================================
-- Sistema SaaS com RLS (Row Level Security) habilitado
-- Execute este script no SQL Editor do Supabase
-- ================================================================

-- ================================================================
-- 1. ATUALIZAÇÃO DA TABELA MEETINGS
-- ================================================================

-- Adicionar campos específicos para o Hub de Reuniões (um por vez)
DO $$ 
BEGIN
  -- Adicionar meeting_type se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'meeting_type') THEN
    ALTER TABLE meetings ADD COLUMN meeting_type VARCHAR(20) NOT NULL DEFAULT 'briefing';
    ALTER TABLE meetings ADD CONSTRAINT meetings_meeting_type_check CHECK (meeting_type IN ('briefing', 'budget', 'concept', 'presentation', 'revision', 'construction', 'delivery'));
  END IF;

  -- Adicionar phase se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'phase') THEN
    ALTER TABLE meetings ADD COLUMN phase VARCHAR(20) NOT NULL DEFAULT 'initial';
    ALTER TABLE meetings ADD CONSTRAINT meetings_phase_check CHECK (phase IN ('initial', 'contract', 'design', 'execution', 'construction', 'delivery', 'finished'));
  END IF;

  -- Adicionar mood se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'mood') THEN
    ALTER TABLE meetings ADD COLUMN mood VARCHAR(20);
    ALTER TABLE meetings ADD CONSTRAINT meetings_mood_check CHECK (mood IN ('positive', 'neutral', 'negative'));
  END IF;

  -- Adicionar satisfaction_score se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'satisfaction_score') THEN
    ALTER TABLE meetings ADD COLUMN satisfaction_score INTEGER;
    ALTER TABLE meetings ADD CONSTRAINT meetings_satisfaction_score_check CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5);
  END IF;

  -- Adicionar has_recording se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'has_recording') THEN
    ALTER TABLE meetings ADD COLUMN has_recording BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar has_transcription se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'has_transcription') THEN
    ALTER TABLE meetings ADD COLUMN has_transcription BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar audio_url se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'audio_url') THEN
    ALTER TABLE meetings ADD COLUMN audio_url TEXT;
  END IF;

  -- Adicionar transcription_summary se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'transcription_summary') THEN
    ALTER TABLE meetings ADD COLUMN transcription_summary JSONB;
  END IF;

  -- Adicionar estimated_duration se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'estimated_duration') THEN
    ALTER TABLE meetings ADD COLUMN estimated_duration INTEGER DEFAULT 60; -- em minutos
  END IF;

  -- Adicionar actual_duration se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'actual_duration') THEN
    ALTER TABLE meetings ADD COLUMN actual_duration INTEGER; -- em minutos
  END IF;
END $$;

-- Adicionar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_type ON meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_phase ON meetings(phase);
CREATE INDEX IF NOT EXISTS idx_meetings_has_recording ON meetings(has_recording);
CREATE INDEX IF NOT EXISTS idx_meetings_has_transcription ON meetings(has_transcription);

-- ================================================================
-- 2. TABELA: MEETING_AGENDAS (Pautas de Reuniões)
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Informações do item da pauta
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  order_index INTEGER NOT NULL DEFAULT 1,
  required BOOLEAN DEFAULT true,
  
  -- Status
  completed BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_duration CHECK (duration_minutes > 0),
  CONSTRAINT positive_order CHECK (order_index > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_meeting_id ON meeting_agendas(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_order ON meeting_agendas(order_index);

-- RLS
ALTER TABLE meeting_agendas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting agendas" ON meeting_agendas;
DROP POLICY IF EXISTS "Users can create meeting agendas" ON meeting_agendas;
DROP POLICY IF EXISTS "Users can update own meeting agendas" ON meeting_agendas;
DROP POLICY IF EXISTS "Users can delete own meeting agendas" ON meeting_agendas;

CREATE POLICY "Users can view meeting agendas" ON meeting_agendas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create meeting agendas" ON meeting_agendas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meeting agendas" ON meeting_agendas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meeting agendas" ON meeting_agendas FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 3. TABELA: MEETING_CHECKLISTS (Checklists de Reuniões)
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Informações do item
  text VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Geral',
  required BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meeting_checklists_meeting_id ON meeting_checklists(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_checklists_category ON meeting_checklists(category);
CREATE INDEX IF NOT EXISTS idx_meeting_checklists_required ON meeting_checklists(required);

-- RLS
ALTER TABLE meeting_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting checklists" ON meeting_checklists;
DROP POLICY IF EXISTS "Users can create meeting checklists" ON meeting_checklists;
DROP POLICY IF EXISTS "Users can update own meeting checklists" ON meeting_checklists;
DROP POLICY IF EXISTS "Users can delete own meeting checklists" ON meeting_checklists;

CREATE POLICY "Users can view meeting checklists" ON meeting_checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create meeting checklists" ON meeting_checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meeting checklists" ON meeting_checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meeting checklists" ON meeting_checklists FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 4. TABELA: MEETING_DECISIONS (Decisões de Reuniões)
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Informações da decisão
  description TEXT NOT NULL,
  responsible VARCHAR(255) NOT NULL,
  deadline DATE,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  
  -- Assinatura digital
  signature_requested BOOLEAN DEFAULT false,
  signature_completed BOOLEAN DEFAULT false,
  signature_date TIMESTAMP WITH TIME ZONE,
  signature_ip VARCHAR(45),
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_meeting_id ON meeting_decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_status ON meeting_decisions(status);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_priority ON meeting_decisions(priority);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_deadline ON meeting_decisions(deadline);
CREATE INDEX IF NOT EXISTS idx_meeting_decisions_signature_requested ON meeting_decisions(signature_requested);

-- RLS
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting decisions" ON meeting_decisions;
DROP POLICY IF EXISTS "Users can create meeting decisions" ON meeting_decisions;
DROP POLICY IF EXISTS "Users can update own meeting decisions" ON meeting_decisions;
DROP POLICY IF EXISTS "Users can delete own meeting decisions" ON meeting_decisions;

CREATE POLICY "Users can view meeting decisions" ON meeting_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create meeting decisions" ON meeting_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meeting decisions" ON meeting_decisions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meeting decisions" ON meeting_decisions FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 5. TABELA: MEETING_ATTENDEES (Participantes de Reuniões)
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Informações do participante
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('architect', 'client', 'engineer', 'contractor', 'supplier', 'team', 'other')),
  confirmed BOOLEAN DEFAULT false,
  
  -- Participação
  attended BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_attendee_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_email ON meeting_attendees(email);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_role ON meeting_attendees(role);

-- RLS
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting attendees" ON meeting_attendees;
DROP POLICY IF EXISTS "Users can create meeting attendees" ON meeting_attendees;
DROP POLICY IF EXISTS "Users can update own meeting attendees" ON meeting_attendees;
DROP POLICY IF EXISTS "Users can delete own meeting attendees" ON meeting_attendees;

CREATE POLICY "Users can view meeting attendees" ON meeting_attendees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create meeting attendees" ON meeting_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meeting attendees" ON meeting_attendees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meeting attendees" ON meeting_attendees FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 6. TABELA: MEETING_RECORDINGS (Gravações de Reuniões)
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Arquivo de áudio
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration_seconds INTEGER,
  mime_type VARCHAR(100) DEFAULT 'audio/webm',
  
  -- Transcrição
  transcription TEXT,
  transcription_status VARCHAR(20) DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_progress INTEGER DEFAULT 0 CHECK (transcription_progress >= 0 AND transcription_progress <= 100),
  
  -- IA Processing
  ai_summary JSONB,
  ai_extracted_decisions JSONB,
  ai_processing_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_meeting_id ON meeting_recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_transcription_status ON meeting_recordings(transcription_status);
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_ai_processing_status ON meeting_recordings(ai_processing_status);

-- RLS
ALTER TABLE meeting_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting recordings" ON meeting_recordings;
DROP POLICY IF EXISTS "Users can create meeting recordings" ON meeting_recordings;
DROP POLICY IF EXISTS "Users can update own meeting recordings" ON meeting_recordings;
DROP POLICY IF EXISTS "Users can delete own meeting recordings" ON meeting_recordings;

CREATE POLICY "Users can view meeting recordings" ON meeting_recordings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create meeting recordings" ON meeting_recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meeting recordings" ON meeting_recordings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meeting recordings" ON meeting_recordings FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 7. FUNCTIONS E TRIGGERS
-- ================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_meeting_agendas_updated_at ON meeting_agendas;
CREATE TRIGGER update_meeting_agendas_updated_at BEFORE UPDATE ON meeting_agendas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_checklists_updated_at ON meeting_checklists;
CREATE TRIGGER update_meeting_checklists_updated_at BEFORE UPDATE ON meeting_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_decisions_updated_at ON meeting_decisions;
CREATE TRIGGER update_meeting_decisions_updated_at BEFORE UPDATE ON meeting_decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_attendees_updated_at ON meeting_attendees;
CREATE TRIGGER update_meeting_attendees_updated_at BEFORE UPDATE ON meeting_attendees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_recordings_updated_at ON meeting_recordings;
CREATE TRIGGER update_meeting_recordings_updated_at BEFORE UPDATE ON meeting_recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar status de decisões em atraso
CREATE OR REPLACE FUNCTION update_overdue_decisions()
RETURNS void AS $$
BEGIN
  UPDATE meeting_decisions 
  SET status = 'overdue'
  WHERE status = 'pending' 
    AND deadline < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular progresso do projeto baseado nas reuniões
CREATE OR REPLACE FUNCTION calculate_project_meeting_progress(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_meetings INTEGER;
  v_completed_meetings INTEGER;
  v_progress INTEGER;
  v_current_phase VARCHAR(20);
  v_last_meeting_type VARCHAR(20);
BEGIN
  -- Contar reuniões totais e concluídas
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
  
  -- Determinar fase atual baseada na última reunião
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
  
  RETURN jsonb_build_object(
    'total_meetings', v_total_meetings,
    'completed_meetings', v_completed_meetings,
    'progress', v_progress,
    'current_phase', v_current_phase,
    'last_meeting_type', COALESCE(v_last_meeting_type, 'none')
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 8. VIEWS ESPECÍFICAS PARA O HUB DE REUNIÕES
-- ================================================================

-- View consolidada de reuniões com todas as informações
CREATE OR REPLACE VIEW meetings_complete AS
SELECT 
  m.*,
  
  -- Contadores de agenda
  COALESCE(agenda_stats.total_items, 0) as agenda_items_total,
  COALESCE(agenda_stats.completed_items, 0) as agenda_items_completed,
  
  -- Contadores de checklist
  COALESCE(checklist_stats.total_items, 0) as checklist_items_total,
  COALESCE(checklist_stats.completed_items, 0) as checklist_items_completed,
  COALESCE(checklist_stats.required_items, 0) as checklist_items_required,
  
  -- Contadores de decisões
  COALESCE(decision_stats.total_decisions, 0) as decisions_total,
  COALESCE(decision_stats.pending_decisions, 0) as decisions_pending,
  COALESCE(decision_stats.completed_decisions, 0) as decisions_completed,
  COALESCE(decision_stats.overdue_decisions, 0) as decisions_overdue,
  
  -- Contadores de participantes
  COALESCE(attendee_stats.total_attendees, 0) as attendees_total,
  COALESCE(attendee_stats.confirmed_attendees, 0) as attendees_confirmed,
  COALESCE(attendee_stats.attended_attendees, 0) as attendees_attended,
  
  -- Informações de gravação
  recording_info.file_url as recording_url,
  recording_info.duration_seconds as recording_duration,
  recording_info.transcription_status,
  recording_info.ai_processing_status

FROM meetings m

-- Estatísticas de agenda
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE completed = true) as completed_items
  FROM meeting_agendas 
  WHERE meeting_id = m.id
) agenda_stats ON true

-- Estatísticas de checklist
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE completed = true) as completed_items,
    COUNT(*) FILTER (WHERE required = true) as required_items
  FROM meeting_checklists 
  WHERE meeting_id = m.id
) checklist_stats ON true

-- Estatísticas de decisões
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_decisions,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_decisions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_decisions,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_decisions
  FROM meeting_decisions 
  WHERE meeting_id = m.id
) decision_stats ON true

-- Estatísticas de participantes
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_attendees,
    COUNT(*) FILTER (WHERE confirmed = true) as confirmed_attendees,
    COUNT(*) FILTER (WHERE attended = true) as attended_attendees
  FROM meeting_attendees 
  WHERE meeting_id = m.id
) attendee_stats ON true

-- Informações de gravação
LEFT JOIN LATERAL (
  SELECT 
    file_url,
    duration_seconds,
    transcription_status,
    ai_processing_status
  FROM meeting_recordings 
  WHERE meeting_id = m.id
  ORDER BY created_at DESC
  LIMIT 1
) recording_info ON true;

-- View de timeline de projetos
CREATE OR REPLACE VIEW project_timelines AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.client_name,
  p.start_date,
  p.end_date,
  p.status as project_status,
  
  -- Progresso baseado em reuniões
  meeting_progress.total_meetings,
  meeting_progress.completed_meetings,
  meeting_progress.progress,
  meeting_progress.current_phase,
  
  -- Próxima reunião
  next_meeting.id as next_meeting_id,
  next_meeting.meeting_type as next_meeting_type,
  next_meeting.meeting_date as next_meeting_date,
  next_meeting.title as next_meeting_title,
  
  -- Última reunião
  last_meeting.id as last_meeting_id,
  last_meeting.meeting_type as last_meeting_type,
  last_meeting.meeting_date as last_meeting_date,
  last_meeting.satisfaction_score as last_meeting_satisfaction

FROM projects p

-- Progresso baseado em reuniões
LEFT JOIN LATERAL (
  SELECT * FROM jsonb_to_record(calculate_project_meeting_progress(p.id)) AS x(
    total_meetings INTEGER,
    completed_meetings INTEGER,
    progress INTEGER,
    current_phase VARCHAR(20),
    last_meeting_type VARCHAR(20)
  )
) meeting_progress ON true

-- Próxima reunião agendada
LEFT JOIN LATERAL (
  SELECT id, meeting_type, meeting_date, title
  FROM meetings 
  WHERE project_id = p.id 
    AND status = 'scheduled'
    AND meeting_date >= CURRENT_DATE
  ORDER BY meeting_date ASC, start_time ASC
  LIMIT 1
) next_meeting ON true

-- Última reunião concluída
LEFT JOIN LATERAL (
  SELECT id, meeting_type, meeting_date, satisfaction_score
  FROM meetings 
  WHERE project_id = p.id 
    AND status = 'completed'
  ORDER BY meeting_date DESC, created_at DESC
  LIMIT 1
) last_meeting ON true;

-- ================================================================
-- 9. STORED PROCEDURES PARA OPERAÇÕES COMUNS
-- ================================================================

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
  -- Criar a reunião principal
  INSERT INTO meetings (
    user_id, project_id, meeting_type, title, meeting_date, start_time, status
  ) VALUES (
    p_user_id, p_project_id, p_meeting_type, p_title, p_meeting_date, p_start_time, 'scheduled'
  ) RETURNING id INTO v_meeting_id;
  
  -- Inserir itens da agenda
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
  
  -- Inserir itens do checklist
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

-- ================================================================
-- 10. GRANTS E PERMISSÕES
-- ================================================================

GRANT ALL ON meeting_agendas TO authenticated;
GRANT ALL ON meeting_checklists TO authenticated;
GRANT ALL ON meeting_decisions TO authenticated;
GRANT ALL ON meeting_attendees TO authenticated;
GRANT ALL ON meeting_recordings TO authenticated;

GRANT SELECT ON meetings_complete TO authenticated;
GRANT SELECT ON project_timelines TO authenticated;

-- ================================================================
-- 11. STORAGE BUCKETS (EXECUTAR MANUALMENTE)
-- ================================================================

/*
Execute estes comandos MANUALMENTE no painel do Supabase Storage:

1. Criar bucket para gravações de áudio:
   Nome: meeting-recordings
   Público: false
   
2. Policies de Storage para meeting-recordings:
   - Nome: "Users can upload own recordings"
   - Operação: INSERT
   - Target roles: authenticated
   - Policy: (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1])
   
   - Nome: "Users can view own recordings"
   - Operação: SELECT  
   - Target roles: authenticated
   - Policy: (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1])
*/

-- ================================================================
-- 12. COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================================

COMMENT ON TABLE meeting_agendas IS 'Itens da pauta de reunião ordenados e com duração estimada';
COMMENT ON TABLE meeting_checklists IS 'Checklist de verificação por tipo de reunião';
COMMENT ON TABLE meeting_decisions IS 'Decisões tomadas em reunião com responsáveis e prazos';
COMMENT ON TABLE meeting_attendees IS 'Participantes confirmados e sua participação';
COMMENT ON TABLE meeting_recordings IS 'Gravações de áudio com transcrição automática';

COMMENT ON COLUMN meetings.meeting_type IS 'Tipo de reunião: briefing, budget, concept, presentation, revision, construction, delivery';
COMMENT ON COLUMN meetings.phase IS 'Fase do projeto: initial, contract, design, execution, construction, delivery, finished';
COMMENT ON COLUMN meetings.mood IS 'Humor geral da reunião: positive, neutral, negative';
COMMENT ON COLUMN meetings.satisfaction_score IS 'Pontuação de satisfação de 1 a 5';

COMMENT ON VIEW meetings_complete IS 'View consolidada com todas as informações da reunião';
COMMENT ON VIEW project_timelines IS 'Timeline de projetos com progresso baseado em reuniões';

COMMENT ON FUNCTION calculate_project_meeting_progress(UUID) IS 'Calcula progresso do projeto baseado no tipo de reuniões concluídas';
COMMENT ON FUNCTION create_complete_meeting(UUID, UUID, VARCHAR, VARCHAR, DATE, TIME, JSONB, JSONB, JSONB) IS 'Cria reunião completa com agenda, checklist e participantes';

-- ================================================================
-- ✅ MIGRATION COMPLETA - HUB DE REUNIÕES
-- ================================================================

-- Teste de validação
DO $$
DECLARE
  v_test_meeting_id UUID;
BEGIN
  -- Criar reunião de teste completa
  SELECT create_complete_meeting(
    auth.uid(),
    (SELECT id FROM projects WHERE user_id = auth.uid() LIMIT 1),
    'briefing',
    'Teste Hub de Reuniões',
    CURRENT_DATE + INTERVAL '1 day',
    '14:00',
    '[
      {"title": "Apresentação", "duration_minutes": 10, "order_index": 1},
      {"title": "Briefing do Projeto", "duration_minutes": 30, "order_index": 2}
    ]'::jsonb,
    '[
      {"text": "Definir orçamento", "category": "Financeiro", "required": true},
      {"text": "Escolher estilo", "category": "Design", "required": false}
    ]'::jsonb,
    '[
      {"name": "Cliente Teste", "email": "cliente@teste.com", "role": "client"},
      {"name": "Arquiteto Teste", "email": "arquiteto@teste.com", "role": "architect"}
    ]'::jsonb
  ) INTO v_test_meeting_id;
  
  IF v_test_meeting_id IS NOT NULL THEN
    RAISE NOTICE '✅ Hub de Reuniões configurado com sucesso!';
    RAISE NOTICE '✅ Reunião de teste criada: %', v_test_meeting_id;
    RAISE NOTICE '✅ Sistema pronto para produção!';
    
    -- Limpar teste
    DELETE FROM meetings WHERE id = v_test_meeting_id;
    
  ELSE
    RAISE NOTICE '❌ Erro na configuração do Hub';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro na migration: % - %', SQLSTATE, SQLERRM;
    RAISE NOTICE '💡 Certifique-se de ter pelo menos um projeto cadastrado para testar';
END $$;

-- ================================================================
-- PRÓXIMOS PASSOS PARA DESENVOLVIMENTO
-- ================================================================

/*
1. ✅ Estrutura do banco criada
2. ✅ RLS configurado para SaaS
3. ✅ Índices otimizados
4. ✅ Functions auxiliares
5. ✅ Views consolidadas

PARA FAZER:
- Configurar buckets de storage manualmente
- Implementar APIs de IA (OpenAI/Whisper)
- Conectar frontend com as novas tabelas
- Configurar cron job para decisões em atraso
- Implementar notificações por email

PARA TESTAR:
SELECT * FROM meetings_complete WHERE user_id = auth.uid();
SELECT * FROM project_timelines WHERE project_id = 'seu-projeto-id';
*/