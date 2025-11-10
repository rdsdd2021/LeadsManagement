-- Test Policy Logic
-- Run this to verify the policy conditions work correctly

-- 1. Get your current user ID
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 2. Test the storage.foldername function
SELECT 
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_sample_leads.csv' as test_path,
  storage.foldername('da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_sample_leads.csv') as folder_array,
  (storage.foldername('da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_sample_leads.csv'))[1] as first_folder,
  auth.uid()::text as user_id_text,
  (storage.foldername('da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_sample_leads.csv'))[1] = auth.uid()::text as matches;

-- 3. Test with regex pattern (alternative approach)
SELECT 
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_sample_leads.csv' as test_path,
  auth.uid()::text as user_id,
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_sample_leads.csv' ~ ('^' || auth.uid()::text || '/') as regex_matches;

-- 4. Check the actual policy definitions
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'csv_%'
ORDER BY policyname;
