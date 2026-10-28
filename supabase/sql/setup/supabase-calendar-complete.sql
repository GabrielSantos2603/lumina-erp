-- =====================================================
-- SCRIPT: Sistema Completo de Calendário e Rastreamento de Tempo
-- =====================================================
-- Este script cria todas as tabelas necessárias para:
-- - Calendário com eventos, reuniões, entregas
-- - Rastreamento de tempo por projeto
-- - Tarefas e cronogramas
-- - Integração com equipe e projetos
-- =====================================================

-- =====================================================
-- TABELA: tasks
-- Tarefas do projeto
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Informações da tarefa
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Status e prioridade
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Datas
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Atribuição
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Estimativas
  estimated_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2),
  
  -- Progresso
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Tags e categorização
  tags TEXT[],
  category VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: time_entries
-- Rastreamento de tempo gasto em projetos
-- =====================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Informações de tempo
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- em segundos
  
  -- Descrição
  description TEXT,
  notes TEXT,
  
  -- Valores (para cálculo de custos)
  hourly_rate DECIMAL(10, 2), -- Valor por hora
  total_cost DECIMAL(10, 2), -- Custo total calculado
  billable BOOLEAN DEFAULT true, -- Se é tempo faturável
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para time_entries
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start ON time_entries(start_time);
-- Índice por data usando apenas start_time (permite queries por range de datas)
CREATE INDEX IF NOT EXISTS idx_time_entries_start_date ON time_entries(start_time) WHERE start_time IS NOT NULL;

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);

-- =====================================================
-- TABELA: calendar_events
-- Eventos do calendário (reuniões, entregas, marcos)
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Informações do evento
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  
  -- Tipo de evento
  event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'delivery', 'milestone', 'deadline', 'reminder', 'other')),
  
  -- Datas e horários
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  
  -- Recorrência
  recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- Regra de recorrência (RRULE)
  
  -- Participantes
  participants UUID[], -- Array de user IDs
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  
  -- Notificações
  reminder_minutes INTEGER[], -- Ex: [15, 60] para lembrete 15min e 1h antes
  
  -- Cor para visualização
  color VARCHAR(50) DEFAULT '#3b82f6',
  
  -- Links e anexos
  meeting_url TEXT,
  attachments JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(start_time, end_time);

-- =====================================================
-- TABELA: team_member_rates
-- Taxas horárias dos membros da equipe
-- =====================================================
CREATE TABLE IF NOT EXISTS team_member_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Taxas
  hourly_rate DECIMAL(10, 2) NOT NULL, -- Valor por hora
  currency VARCHAR(3) DEFAULT 'BRL',
  
  -- Período de validade
  valid_from DATE NOT NULL,
  valid_to DATE,
  
  -- Tipo de taxa
  rate_type VARCHAR(50) DEFAULT 'regular' CHECK (rate_type IN ('regular', 'overtime', 'holiday', 'special')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, project_id, valid_from, rate_type)
);

-- Índices para team_member_rates
CREATE INDEX IF NOT EXISTS idx_team_rates_user ON team_member_rates(user_id);
CREATE INDEX IF NOT EXISTS idx_team_rates_project ON team_member_rates(project_id);
CREATE INDEX IF NOT EXISTS idx_team_rates_dates ON team_member_rates(valid_from, valid_to);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular duração automaticamente
CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
    
    -- Calcular custo se houver taxa horária
    IF NEW.hourly_rate IS NOT NULL THEN
      NEW.total_cost = (NEW.duration / 3600.0) * NEW.hourly_rate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular duração
DROP TRIGGER IF EXISTS trigger_calculate_duration ON time_entries;
CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_duration();

-- Função para atualizar horas reais da tarefa
CREATE OR REPLACE FUNCTION update_task_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tasks
  SET actual_hours = (
    SELECT COALESCE(SUM(duration / 3600.0), 0)
    FROM time_entries
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
      AND end_time IS NOT NULL
  )
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar horas da tarefa
DROP TRIGGER IF EXISTS trigger_update_task_hours ON time_entries;
CREATE TRIGGER trigger_update_task_hours
  AFTER INSERT OR UPDATE OR DELETE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_task_actual_hours();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_time_entries_updated_at ON time_entries;
CREATE TRIGGER trigger_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER trigger_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Ativar RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_rates ENABLE ROW LEVEL SECURITY;

-- Políticas para time_entries
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own time entries" ON time_entries;
CREATE POLICY "Users can insert own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own time entries" ON time_entries;
CREATE POLICY "Users can delete own time entries"
  ON time_entries FOR DELETE
  USING (user_id = auth.uid());

-- Políticas para tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (user_id = auth.uid());

-- Políticas para calendar_events
DROP POLICY IF EXISTS "Users can view own events" ON calendar_events;
CREATE POLICY "Users can view own events"
  ON calendar_events FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() = ANY(participants));

DROP POLICY IF EXISTS "Users can insert own events" ON calendar_events;
CREATE POLICY "Users can insert own events"
  ON calendar_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own events" ON calendar_events;
CREATE POLICY "Users can update own events"
  ON calendar_events FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own events" ON calendar_events;
CREATE POLICY "Users can delete own events"
  ON calendar_events FOR DELETE
  USING (user_id = auth.uid());

-- Políticas para team_member_rates
DROP POLICY IF EXISTS "Users can view own rates" ON team_member_rates;
CREATE POLICY "Users can view own rates"
  ON team_member_rates FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own rates" ON team_member_rates;
CREATE POLICY "Users can insert own rates"
  ON team_member_rates FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own rates" ON team_member_rates;
CREATE POLICY "Users can update own rates"
  ON team_member_rates FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para resumo de tempo por projeto
CREATE OR REPLACE VIEW project_time_summary AS
SELECT 
  te.project_id,
  COALESCE(p.name, 'Sem projeto') AS project_name,
  te.user_id,
  COALESCE(prof.full_name, prof.email, 'Usuário') AS user_name,
  COUNT(*) AS entry_count,
  SUM(te.duration) / 3600.0 AS total_hours,
  SUM(te.total_cost) AS total_cost,
  SUM(CASE WHEN te.billable THEN te.duration ELSE 0 END) / 3600.0 AS billable_hours,
  SUM(CASE WHEN NOT te.billable THEN te.duration ELSE 0 END) / 3600.0 AS non_billable_hours
FROM time_entries te
LEFT JOIN projects p ON te.project_id = p.id
LEFT JOIN profiles prof ON te.user_id = prof.id
WHERE te.end_time IS NOT NULL
GROUP BY te.project_id, p.name, te.user_id, prof.full_name, prof.email;

-- View para tarefas com progresso
CREATE OR REPLACE VIEW tasks_with_progress AS
SELECT 
  t.*,
  COALESCE(p.name, 'Sem projeto') AS project_name,
  COALESCE(prof_created.full_name, prof_created.email, 'Usuário') AS creator_name,
  COALESCE(prof_assigned.full_name, prof_assigned.email, 'Não atribuído') AS assignee_name,
  CASE 
    WHEN t.estimated_hours > 0 THEN 
      ROUND((t.actual_hours / t.estimated_hours * 100)::NUMERIC, 2)
    ELSE 0
  END AS time_progress_percent,
  CASE
    WHEN t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled') THEN true
    ELSE false
  END AS is_overdue
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN profiles prof_created ON t.user_id = prof_created.id
LEFT JOIN profiles prof_assigned ON t.assigned_to = prof_assigned.id;

-- View para eventos do calendário com informações completas
CREATE OR REPLACE VIEW calendar_events_full AS
SELECT 
  ce.*,
  COALESCE(p.name, 'Sem projeto') AS project_name,
  COALESCE(prof.full_name, prof.email, 'Usuário') AS creator_name,
  t.title AS task_title,
  CASE 
    WHEN ce.start_time < NOW() AND ce.status = 'scheduled' THEN 'past'
    WHEN ce.start_time <= NOW() + INTERVAL '1 hour' AND ce.status = 'scheduled' THEN 'upcoming'
    ELSE 'future'
  END AS time_status
FROM calendar_events ce
LEFT JOIN projects p ON ce.project_id = p.id
LEFT JOIN profiles prof ON ce.user_id = prof.id
LEFT JOIN tasks t ON ce.task_id = t.id;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar tabelas criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('time_entries', 'tasks', 'calendar_events', 'team_member_rates')
ORDER BY table_name;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('time_entries', 'tasks', 'calendar_events', 'team_member_rates')
ORDER BY tablename, policyname;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

