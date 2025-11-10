-- Fix realtime bindings for leads table
-- This resolves the "mismatch between server and client bindings" error

-- Drop and recreate the realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime;

-- Add leads table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Ensure replica identity is set correctly
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- Grant necessary permissions
GRANT SELECT ON public.leads TO authenticated;
GRANT SELECT ON public.leads TO anon;

-- Notify realtime to reload
NOTIFY pgrst, 'reload schema';

COMMENT ON PUBLICATION supabase_realtime IS 'Realtime publication for leads table with correct bindings';
