-- Remove the foreign key constraint on categories that references a users table
-- This constraint is causing issues because auth.users is managed by Supabase
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;

-- We still want to ensure data integrity, so we'll keep the user_id column as NOT NULL
-- but without the foreign key constraint to auth.users (which we can't reference directly)