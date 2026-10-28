-- ==================================================
-- POLÍTICAS DE STORAGE PARA PROJECT-MEDIA
-- ==================================================
-- Este script configura as políticas do bucket storage
-- para permitir upload, visualização e exclusão de arquivos
-- ==================================================

-- 1. Remover políticas antigas do storage (se existirem)
DROP POLICY IF EXISTS "Users can upload media to their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their project media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 2. Criar política de UPLOAD (INSERT)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-media'
);

-- 3. Criar política de VISUALIZAÇÃO (SELECT)
CREATE POLICY "Allow authenticated access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-media'
);

-- 4. Criar política de ATUALIZAÇÃO (UPDATE)
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-media'
)
WITH CHECK (
  bucket_id = 'project-media'
);

-- 5. Criar política de EXCLUSÃO (DELETE)
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-media'
);

-- 6. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%authenticated%'
ORDER BY cmd;

-- ==================================================
-- RESULTADO ESPERADO:
-- 
-- Você deve ver 4 políticas:
-- 1. "Allow authenticated uploads" - INSERT
-- 2. "Allow authenticated access" - SELECT  
-- 3. "Allow authenticated updates" - UPDATE
-- 4. "Allow authenticated deletes" - DELETE
--
-- Todas com roles = {authenticated}
-- ==================================================

-- 7. (IMPORTANTE) Verificar se o bucket existe
SELECT 
  id,
  name,
  public
FROM storage.buckets
WHERE name = 'project-media';

-- ==================================================
-- SE O BUCKET NÃO EXISTIR, EXECUTE:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('project-media', 'project-media', false);
--
-- ==================================================

-- 8. Verificar permissões de RLS do bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'project-media';

-- ==================================================
-- FIM DA CONFIGURAÇÃO
-- ==================================================

-- TROUBLESHOOTING:
-- Se ainda houver erro após executar este script:
--
-- 1. Verifique se você está logado (authenticated)
-- 2. Confirme que o bucket 'project-media' existe
-- 3. Tente fazer logout e login novamente
-- 4. Limpe o cache do navegador (Ctrl+Shift+Del)
-- 5. Verifique o console do navegador (F12)
--
-- ==================================================

