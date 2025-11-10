-- Test script to verify role-based filtering is working correctly
-- Run this in Supabase Dashboard SQL Editor

-- Test 1: Admin should see all 2500 leads in filter counts
SELECT 'Test 1: Admin filter counts' as test_name,
  get_filter_counts('{}', '{}', '{}', '{}', '', NULL, NULL, '{}'::jsonb, NULL) as result;

-- Test 2: Sales rep should see only 8 leads in filter counts
SELECT 'Test 2: Sales Rep filter counts' as test_name,
  get_filter_counts('{}', '{}', '{}', '{}', '', NULL, NULL, '{}'::jsonb,
    (SELECT id FROM auth.users WHERE email = 'user1@test.in')) as result;

-- Test 3: Admin should see all unique values
SELECT 'Test 3: Admin unique values' as test_name,
  get_unique_values(NULL) as result;

-- Test 4: Sales rep should see only their unique values
SELECT 'Test 4: Sales Rep unique values' as test_name,
  get_unique_values((SELECT id FROM auth.users WHERE email = 'user1@test.in')) as result;

-- Test 5: Verify sales rep has exactly 8 leads
SELECT 'Test 5: Sales rep lead count' as test_name,
  COUNT(*) as lead_count,
  COUNT(DISTINCT school) as unique_schools,
  COUNT(DISTINCT district) as unique_districts,
  COUNT(DISTINCT gender) as unique_genders,
  COUNT(DISTINCT stream) as unique_streams
FROM leads
WHERE assigned_to = (SELECT id FROM auth.users WHERE email = 'user1@test.in');
