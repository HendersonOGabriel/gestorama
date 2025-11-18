-- Adiciona a coluna para rastrear a data da última concessão de XP por login diário
ALTER TABLE public.gamification
ADD COLUMN IF NOT EXISTS last_login_xp_awarded DATE;

-- Comentário para documentar a nova coluna
COMMENT ON COLUMN public.gamification.last_login_xp_awarded IS 'Registra a data em que o último bônus de XP por login diário foi concedido para evitar duplicidade.';
