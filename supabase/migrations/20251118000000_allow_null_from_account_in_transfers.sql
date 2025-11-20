-- Alter transfers table to allow null from_account
ALTER TABLE public.transfers ALTER COLUMN from_account DROP NOT NULL;
