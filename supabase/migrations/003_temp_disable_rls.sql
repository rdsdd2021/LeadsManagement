-- Temporarily disable RLS for testing
-- WARNING: This is for development only!

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify data exists
SELECT * FROM public.users;
