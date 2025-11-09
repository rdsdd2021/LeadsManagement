-- Create a function to efficiently get unique filter values
-- This works with millions of rows without performance issues

-- Drop function if exists
DROP FUNCTION IF EXISTS get_unique_filter_values();

-- Create function to get unique values for filters
CREATE OR REPLACE FUNCTION get_unique_filter_values()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Use DISTINCT to get unique values efficiently
  -- PostgreSQL optimizes DISTINCT queries with indexes
  SELECT json_build_object(
    'status', (
      SELECT json_agg(DISTINCT status ORDER BY status)
      FROM public.leads
      WHERE status IS NOT NULL
    ),
    'category', (
      SELECT json_agg(DISTINCT category ORDER BY category)
      FROM public.leads
      WHERE category IS NOT NULL
    ),
    'region', (
      SELECT json_agg(DISTINCT region ORDER BY region)
      FROM public.leads
      WHERE region IS NOT NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unique_filter_values() TO authenticated;
GRANT EXECUTE ON FUNCTION get_unique_filter_values() TO anon;

-- Add comment
COMMENT ON FUNCTION get_unique_filter_values() IS 
  'Efficiently returns unique values for status, category, and region filters. 
   Works with millions of rows using PostgreSQL DISTINCT optimization.';

-- Test the function
SELECT get_unique_filter_values();
