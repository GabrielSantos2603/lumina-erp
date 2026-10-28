-- ==================================================
-- ATUALIZAÇÃO DE POLÍTICA RLS - PROJECT MEDIA
-- ==================================================
-- Este script atualiza apenas a política de INSERT
-- para corrigir o erro de Row Level Security
-- ==================================================

-- 1. Remover política antiga de INSERT (se existir)
DROP POLICY IF EXISTS "Users can upload media to their projects" ON project_media;

-- 2. Criar nova política de INSERT simplificada
CREATE POLICY "Users can upload media to their projects"
  ON project_media
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- 3. Verificar se funcionou
SELECT 
  policyname,
  cmd,
  with_check::text as check_expression
FROM pg_policies 
WHERE tablename = 'project_media' 
AND policyname = 'Users can upload media to their projects';

-- ==================================================
-- RESULTADO ESPERADO:
-- 
-- policyname: "Users can upload media to their projects"
-- cmd: "INSERT"
-- check_expression: "(user_id = auth.uid())"
--
-- Se ver isso acima, está tudo certo! ✅
-- ==================================================

-- 4. (Opcional) Ver todas as políticas da tabela
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN qual::text
    ELSE with_check::text
  END as policy_definition
FROM pg_policies 
WHERE tablename = 'project_media'
ORDER BY cmd;

-- ==================================================
-- FIM DA ATUALIZAÇÃO
-- ==================================================

