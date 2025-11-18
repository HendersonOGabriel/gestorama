-- Adiciona a coluna para rastrear o último mês verificado para a conquista de aumento de economia
ALTER TABLE public.gamification
ADD COLUMN IF NOT EXISTS last_savings_check_month TEXT;

-- Comentário para documentar a nova coluna
COMMENT ON COLUMN public.gamification.last_savings_check_month IS 'Registra o último mês (formato YYYY-MM) que foi verificado para a conquista de aumento de economia, para evitar duplicidade.';
