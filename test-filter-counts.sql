-- Test the get_filter_counts function with role-based filtering
-- Run this in Supabase SQL Editor to verify the function works

-- Test 1: Get counts for ALL leads (admin - no user_id filter)
SELECT 'Test 1: Admin (all leads)' as test_name, 
       get_filter_counts(
         '{}', -- p_school
         '{}', -- p_district
         '{}', -- p_gender
         '{}', -- p_stream
         '', -- p_search_query
         NULL, -- p_date_from
         NULL, -- p_date_to
         '{}'::jsonb, -- p_custom_filters
         NULL -- p_user_id (NULL = admin, sees all)
       ) as result;

-- Test 2: Get counts for specific user's assigned leads (sales rep)
-- Replace 'USER_ID_HERE' with actual user ID from users table
SELECT 'Test 2: Sales Rep (user1@test.in)' as test_name,
       get_filter_counts(
         '{}', -- p_school
         '{}', -- p_district
         '{}', -- p_gender
         '{}', -- p_stream
         '', -- p_search_query
         NULL, -- p_date_from
         NULL, -- p_date_to
         '{}'::jsonb, -- p_custom_filters
         (SELECT id FROM auth.users WHERE email = 'user1@test.in') -- p_user_id
       ) as result;

-- Test 3: Check how many leads are assigned to user1@test.in
SELECT 'Test 3: Count of leads assigned to user1@test.in' as test_name,
       COUNT(*) as lead_count
FROM leads
WHERE assigned_to = (SELECT id FROM auth.users WHERE email = 'user1@test.in');

-- Test 4: Check the actual gender breakdown for user1@test.in's leads
SELECT 'Test 4: Gender breakdown for user1@test.in' as test_name,
       gender,
       COUNT(*) as count
FROM leads
WHERE assigned_to = (SELECT id FROM auth.users WHERE email = 'user1@test.in')
GROUP BY gender;
