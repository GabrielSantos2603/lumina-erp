-- =====================================================
-- SCRIPT: Configuração do Storage para Avatares
-- =====================================================
-- Este script configura o bucket 'avatars' no Supabase Storage
-- e define as políticas RLS para upload e acesso de avatares
-- =====================================================

-- Criar bucket para avatars (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Limpar políticas existentes
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatar" ON storage.objects;

-- =====================================================
-- POLÍTICAS RLS PARA STORAGE
-- =====================================================

-- Política para upload (INSERT)
-- Permite que usuários autenticados façam upload de seus próprios avatares
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Política para visualização (SELECT)
-- Permite acesso público para visualizar avatares
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'avatars');

-- Política para atualização (UPDATE)
-- Permite que usuários atualizem seus próprios avatares
CREATE POLICY "Allow users to update own avatar"
ON storage.objects FOR UPDATE TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Política para exclusão (DELETE)
-- Permite que usuários excluam seus próprios avatares
CREATE POLICY "Allow users to delete own avatar"
ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Verificar as políticas aplicadas
SELECT 
  policyname, 
  cmd, 
  qual,
  with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%' OR policyname LIKE '%authenticated%';

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
-- 
-- 1. Execute este script no SQL Editor do Supabase
-- 
-- 2. O bucket 'avatars' será criado como público
--    (public = true significa que as URLs são acessíveis publicamente)
-- 
-- 3. Estrutura de pastas:
--    avatars/
--      └── [user-id]-[timestamp].jpg
-- 
-- 4. Tamanho máximo recomendado: 2MB por arquivo
-- 
-- 5. Formatos suportados: JPG, PNG, GIF, WebP
-- 
-- 6. Upload via código:
--    const { error } = await supabase.storage
--      .from('avatars')
--      .upload(`avatars/${fileName}`, file);
-- 
-- 7. Obter URL pública:
--    const { data } = supabase.storage
--      .from('avatars')
--      .getPublicUrl(`avatars/${fileName}`);
-- 
-- =====================================================

