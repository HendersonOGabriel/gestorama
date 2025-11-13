-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'member');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT exists (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 
  CASE 
    WHEN role = 'owner' THEN 'owner'::app_role
    WHEN role = 'member' THEN 'member'::app_role
    ELSE 'member'::app_role
  END as role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update the handle_new_user trigger to also create user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    'owner'
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

  RETURN NEW;
END;
$function$;