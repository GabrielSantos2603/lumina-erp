-- ================================================================
-- ADICIONAR CAMPO DE SETUP COMPLETO NA TABELA ORGANIZATIONS
-- ================================================================
-- Execute este script no SQL Editor do Supabase
-- Adiciona flag para indicar se a empresa completou o setup inicial
-- ================================================================

-- Adicionar coluna setup_completed (opcional, mas útil para rastreamento)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;

-- Adicionar coluna setup_completed_at para saber quando foi completado
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;

-- Comentários nas colunas
COMMENT ON COLUMN public.organizations.setup_completed IS 'Indica se a empresa completou o setup inicial (razão social, CNPJ, email, telefone)';
COMMENT ON COLUMN public.organizations.setup_completed_at IS 'Data e hora em que o setup foi completado';

-- Atualizar organizations existentes que já têm company_name e cnpj
UPDATE public.organizations
SET 
  setup_completed = true,
  setup_completed_at = COALESCE(updated_at, created_at)
WHERE 
  company_name IS NOT NULL 
  AND company_name != ''
  AND cnpj IS NOT NULL 
  AND cnpj != ''
  AND setup_completed IS NOT true;

-- ================================================================
-- NOTA: Este campo é OPCIONAL
-- ================================================================
-- O sistema funciona sem esta coluna, verificando diretamente
-- se os campos essenciais (company_name, cnpj, email, phone) 
-- estão preenchidos na tabela companies.
--
-- Esta coluna pode ser usada para:
-- 1. Performance: evitar query na tabela companies toda vez
-- 2. Analytics: saber quantas empresas completaram o setup
-- 3. Onboarding tracking: métricas de conversão
-- ================================================================

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_organizations_setup_completed 
ON public.organizations(setup_completed) 
WHERE setup_completed = false;

-- ================================================================
-- FUNÇÃO PARA MARCAR SETUP COMO COMPLETO (OPCIONAL)
-- ================================================================
-- Chame esta função quando a empresa salvar os dados essenciais
-- ================================================================

CREATE OR REPLACE FUNCTION public.mark_organization_setup_complete(
  p_organization_id UUID
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.organizations
  SET 
    setup_completed = true,
    setup_completed_at = NOW()
  WHERE 
    id = p_organization_id
    AND setup_completed IS NOT true;
END;
$$;

COMMENT ON FUNCTION public.mark_organization_setup_complete IS 'Marca o setup da organização como completo';

-- ================================================================
-- TRIGGER PARA AUTO-MARCAR COMO COMPLETO (OPCIONAL)
-- ================================================================
-- Marca automaticamente como completo quando company_name e cnpj
-- são preenchidos na tabela organizations
-- ================================================================

CREATE OR REPLACE FUNCTION public.auto_mark_setup_complete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se company_name e cnpj foram preenchidos, marcar setup como completo
  IF NEW.company_name IS NOT NULL 
     AND NEW.company_name != ''
     AND NEW.cnpj IS NOT NULL 
     AND NEW.cnpj != ''
     AND (OLD.setup_completed IS NULL OR OLD.setup_completed = false)
  THEN
    NEW.setup_completed := true;
    NEW.setup_completed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger (opcional)
DROP TRIGGER IF EXISTS trigger_auto_mark_setup_complete ON public.organizations;

CREATE TRIGGER trigger_auto_mark_setup_complete
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_mark_setup_complete();

COMMENT ON TRIGGER trigger_auto_mark_setup_complete ON public.organizations IS 'Auto-marca setup como completo quando company_name e cnpj são preenchidos';

-- ================================================================
-- FIM DO SCRIPT
-- ================================================================

SELECT 
  COUNT(*) as total_organizations,
  COUNT(*) FILTER (WHERE setup_completed = true) as setup_completed,
  COUNT(*) FILTER (WHERE setup_completed = false OR setup_completed IS NULL) as setup_pending
FROM public.organizations;
