-- Adicionar campo company_id na tabela transactions
-- Permite vincular despesas à empresa do usuário

-- Adicionar coluna company_id (opcional, pois nem toda transação é da empresa)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON public.transactions(company_id);

-- Comentário
COMMENT ON COLUMN public.transactions.company_id IS 'ID da empresa relacionada (para despesas da empresa)';
