-- Comprehensive fix for Supabase Realtime
-- Resolves "mismatch between server and client bindings" error

-- Step 1: Drop existing publication and recreate cleanly
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Step 2: Ensure leads table has correct replica identity
-- FULL means all columns are included in replication
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- Step 3: Verify the table is in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
END $$;

-- Step 4: Grant realtime permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT SELECT ON public.leads TO postgres, anon, authenticated;
GRANT ALL ON public.leads TO postgres;

-- Step 5: Enable Row Level Security (if not already enabled)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policy for realtime subscriptions
DROP POLICY IF EXISTS "Enable realtime for authenticated users" ON public.leads;
CREATE POLICY "Enable realtime for authenticated users"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 7: Refresh the realtime schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Verification query (run this manually to check)
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
