-- Test the function with simple parameters
SELECT get_filter_counts(
  p_school := '{}',
  p_district := '{}',
  p_gender := '{}',
  p_stream := '{}',
  p_search_query := '',
  p_date_from := NULL,
  p_date_to := NULL,
  p_custom_filters := '{}'::jsonb
);

-- Also test if the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_filter_counts';

-- Test a simple count query
SELECT 
  COUNT(*) as total_leads,
  COUNT(DISTINCT school) as unique_schools,
  COUNT(DISTINCT district) as unique_districts
FROM leads;
