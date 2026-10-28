-- =====================================================
-- ATUALIZAÇÃO: Adicionar Suporte a Hierarquia, Pesos e Níveis em Tarefas
-- =====================================================
-- Este script adiciona campos necessários para:
-- - Sub-tarefas (hierarquia)
-- - Peso para cálculo de progresso
-- - Níveis de hierarquia
-- =====================================================

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
  -- Parent ID para hierarquia de sub-tarefas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;

  -- Peso para cálculo de progresso percentual
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'weight'
  ) THEN
    ALTER TABLE tasks ADD COLUMN weight DECIMAL(5, 2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 100);
  END IF;

  -- Nível na hierarquia (0 = raiz, 1 = filho, 2 = neto, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'level'
  ) THEN
    ALTER TABLE tasks ADD COLUMN level INTEGER DEFAULT 0 CHECK (level >= 0);
  END IF;

  -- Ordem de exibição dentro do mesmo nível
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE tasks ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;

  -- Referência ao membro da equipe (tabela team)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'assigned_team_member_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_team_member_id UUID REFERENCES team(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks(level);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(project_id, level, order_index) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_team_member ON tasks(assigned_team_member_id);

-- Função para calcular progresso baseado em sub-tarefas e pesos
CREATE OR REPLACE FUNCTION calculate_task_progress(task_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_weight DECIMAL := 0;
  completed_weight DECIMAL := 0;
  sub_task RECORD;
  calculated_progress DECIMAL;
BEGIN
  -- Se não tem sub-tarefas, retorna o progresso direto da tarefa
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE parent_id = task_uuid) THEN
    SELECT COALESCE(progress, 0) INTO calculated_progress FROM tasks WHERE id = task_uuid;
    RETURN calculated_progress;
  END IF;

  -- Calcula progresso baseado em sub-tarefas ponderadas
  FOR sub_task IN 
    SELECT id, weight, progress, status 
    FROM tasks 
    WHERE parent_id = task_uuid
  LOOP
    total_weight := total_weight + COALESCE(sub_task.weight, 1.0);
    
    IF sub_task.status = 'completed' THEN
      completed_weight := completed_weight + COALESCE(sub_task.weight, 1.0);
    ELSIF sub_task.progress > 0 THEN
      completed_weight := completed_weight + (COALESCE(sub_task.weight, 1.0) * sub_task.progress / 100.0);
    END IF;
  END LOOP;

  IF total_weight > 0 THEN
    calculated_progress := (completed_weight / total_weight) * 100;
  ELSE
    calculated_progress := 0;
  END IF;

  -- Atualiza o progresso da tarefa pai
  UPDATE tasks 
  SET progress = calculated_progress::INTEGER,
      updated_at = NOW()
  WHERE id = task_uuid;

  RETURN calculated_progress;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso da tarefa pai quando sub-tarefa muda
CREATE OR REPLACE FUNCTION update_parent_task_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    PERFORM calculate_task_progress(NEW.parent_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_update_parent_progress ON tasks;

-- Criar novo trigger
CREATE TRIGGER trigger_update_parent_progress
  AFTER INSERT OR UPDATE OF progress, status, weight ON tasks
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_task_progress();

-- Função para atualizar nível baseado no parent_id
CREATE OR REPLACE FUNCTION update_task_level()
RETURNS TRIGGER AS $$
DECLARE
  parent_level INTEGER;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT COALESCE(level, 0) INTO parent_level FROM tasks WHERE id = NEW.parent_id;
    NEW.level := parent_level + 1;
  ELSE
    NEW.level := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar nível automaticamente
DROP TRIGGER IF EXISTS trigger_update_task_level ON tasks;

CREATE TRIGGER trigger_update_task_level
  BEFORE INSERT OR UPDATE OF parent_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_level();

-- View para tarefas com hierarquia completa
CREATE OR REPLACE VIEW tasks_hierarchy AS
WITH RECURSIVE task_tree AS (
  -- Tarefas raiz (sem parent)
  SELECT 
    id,
    parent_id,
    project_id,
    title,
    status,
    priority,
    progress,
    weight,
    level,
    order_index,
    due_date,
    start_date,
    ARRAY[order_index] AS path,
    0 AS depth
  FROM tasks
  WHERE parent_id IS NULL

  UNION ALL

  -- Sub-tarefas recursivas
  SELECT 
    t.id,
    t.parent_id,
    t.project_id,
    t.title,
    t.status,
    t.priority,
    t.progress,
    t.weight,
    t.level,
    t.order_index,
    t.due_date,
    t.start_date,
    tt.path || t.order_index,
    tt.depth + 1
  FROM tasks t
  INNER JOIN task_tree tt ON t.parent_id = tt.id
)
SELECT 
  t.*,
  p.name AS project_name,
  tm.name AS assigned_team_member_name,
  tm.email AS assigned_team_member_email,
  COUNT(st.id) AS subtasks_count,
  SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) AS completed_subtasks_count,
  calculate_task_progress(t.id) AS calculated_progress
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN team tm ON t.assigned_team_member_id = tm.id
LEFT JOIN tasks st ON st.parent_id = t.id
GROUP BY t.id, p.name, tm.name, tm.email;

-- Comentários
COMMENT ON COLUMN tasks.parent_id IS 'ID da tarefa pai (null para tarefas raiz)';
COMMENT ON COLUMN tasks.weight IS 'Peso da tarefa para cálculo de progresso (0-100)';
COMMENT ON COLUMN tasks.level IS 'Nível na hierarquia (0 = raiz, aumenta com profundidade)';
COMMENT ON COLUMN tasks.order_index IS 'Ordem de exibição dentro do mesmo nível';
COMMENT ON COLUMN tasks.assigned_team_member_id IS 'ID do membro da equipe atribuído (FK para team.id)';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Execute para verificar se as colunas foram adicionadas:
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('parent_id', 'weight', 'level', 'order_index', 'assigned_team_member_id')
ORDER BY column_name;

