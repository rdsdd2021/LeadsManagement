-- Fix RLS policies for users table
-- The issue is that the policies are too restrictive

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- Create more permissive policies
-- Allow authenticated users to read their own profile
CREATE POLICY "Enable read access for authenticated users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow service role to do everything (for server-side operations)
CREATE POLICY "Enable all access for service role"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify the user exists in the users table
-- If not, insert them
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, email FROM auth.users LOOP
    INSERT INTO public.users (id, email, role)
    VALUES (user_record.id, user_record.email, 'viewer')
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Make sure your user is admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'rds2197@gmail.com';
