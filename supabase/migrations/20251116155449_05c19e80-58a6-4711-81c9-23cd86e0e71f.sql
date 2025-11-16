-- Remove redundant role column from profiles table
-- The application uses user_roles table as the single source of truth for roles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Update handle_new_user trigger to not set profiles.role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile (without role)
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email
  );

  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner'::app_role);

  -- Create default subscription
  INSERT INTO public.subscriptions (user_id, plan, member_slots)
  VALUES (NEW.id, 'free', 0);

  -- Create gamification record
  INSERT INTO public.gamification (user_id, level, xp, xp_to_next_level)
  VALUES (NEW.id, 1, 0, 100);

  -- Create yara usage record
  INSERT INTO public.yara_usage (user_id, count, last_reset)
  VALUES (NEW.id, 0, CURRENT_DATE);

  -- Create default account
  INSERT INTO public.accounts (user_id, name, balance, is_default)
  VALUES (NEW.id, 'Conta Principal', 0, true);

  RETURN NEW;
END;
$function$;