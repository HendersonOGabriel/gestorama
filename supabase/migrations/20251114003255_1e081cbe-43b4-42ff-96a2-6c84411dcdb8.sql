-- Enable realtime for key tables
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.cards REPLICA IDENTITY FULL;
ALTER TABLE public.goals REPLICA IDENTITY FULL;
ALTER TABLE public.reminders REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;