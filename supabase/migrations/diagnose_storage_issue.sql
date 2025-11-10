-- Diagnostic Script for Storage RLS Issues
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check if bucket exists
SELECT 
  id, 
  name, 
  public,
  created_at
FROM storage.buckets 
WHERE id = 'csv-imports';

-- 2. Check existing policies on storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'csv_%';

-- 3. Test if current user can be identified
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 4. Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- 5. Test the folder extraction function
SELECT 
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_sample_leads.csv' as test_path,
  (storage.foldername('da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_sample_leads.csv'))[1] as extracted_folder;

-- 6. Check permissions on storage schema
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'storage'
  AND table_name IN ('objects', 'buckets')
  AND grantee = 'authenticated';
