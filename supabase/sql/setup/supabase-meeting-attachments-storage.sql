-- ================================================
-- STORAGE: Meeting Attachments Bucket
-- ================================================

-- Criar bucket para anexos de reuniões
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-attachments', 'meeting-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- POLÍTICAS RLS: Meeting Attachments Storage
-- ================================================

-- Permitir visualização pública dos anexos
CREATE POLICY "Public can view meeting attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'meeting-attachments');

-- Permitir upload de anexos para usuários autenticados
CREATE POLICY "Authenticated users can upload meeting attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-attachments' AND
  auth.role() = 'authenticated'
);

-- Permitir atualização de anexos próprios
CREATE POLICY "Users can update own meeting attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'meeting-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir exclusão de anexos próprios
CREATE POLICY "Users can delete own meeting attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meeting-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
