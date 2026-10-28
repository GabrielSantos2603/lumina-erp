-- Script SQL para criar tabela de notificações e time_entries
-- Execute este script no Supabase SQL Editor

-- ================================================
-- 1. TABELA: NOTIFICATIONS
-- ================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  icon TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Criar políticas
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- ================================================
-- 2. TABELA: TIME_ENTRIES
-- ================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT,
  duration INTEGER NOT NULL, -- duração em segundos
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para time_entries
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON time_entries(created_at DESC);

-- RLS para time_entries
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can create own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON time_entries;

-- Criar políticas
CREATE POLICY "Users can view own time entries" ON time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own time entries" ON time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time entries" ON time_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own time entries" ON time_entries FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em time_entries
DROP TRIGGER IF EXISTS time_entries_updated_at ON time_entries;
CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- ================================================
-- 3. TRIGGERS AUTOMÁTICOS
-- ================================================

-- Função para criar notificação quando projeto é criado
CREATE OR REPLACE FUNCTION notify_project_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Novo projeto criado',
    'O projeto "' || NEW.name || '" foi adicionado ao sistema',
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar quando projeto é criado
DROP TRIGGER IF EXISTS trigger_notify_project_created ON projects;
CREATE TRIGGER trigger_notify_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_project_created();

-- Função para criar notificação quando transação é paga
CREATE OR REPLACE FUNCTION notify_transaction_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.type = 'income' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Pagamento recebido',
      'R$ ' || NEW.amount::TEXT || ' recebido de ' || COALESCE(NEW.client_name, 'cliente'),
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar quando transação é paga
DROP TRIGGER IF EXISTS trigger_notify_transaction_paid ON transactions;
CREATE TRIGGER trigger_notify_transaction_paid
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_transaction_paid();

-- ================================================
-- 4. COMENTÁRIOS
-- ================================================
COMMENT ON TABLE notifications IS 'Notificações em tempo real para usuários';
COMMENT ON TABLE time_entries IS 'Registro de horas trabalhadas em projetos';
COMMENT ON COLUMN notifications.type IS 'Tipo: info, success, warning, error';
COMMENT ON COLUMN notifications.read IS 'Indica se foi lida';
COMMENT ON COLUMN time_entries.duration IS 'Duração em segundos';
