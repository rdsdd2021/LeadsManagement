-- FINAL FIX: Use LIKE pattern matching (simplest and most reliable)
-- This replaces storage.foldername() with a simple LIKE pattern

-- Drop all existing csv policies
DROP POLICY IF EXISTS "csv_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_select_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_update_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_delete_own" ON storage.objects;

-- INSERT: Allow users to upload files that start with their user ID
CREATE POLICY "csv_insert_own" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND name LIKE (auth.uid()::text || '/%')
);

-- SELECT: Allow users to read files that start with their user ID
CREATE POLICY "csv_select_own" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND name LIKE (auth.uid()::text || '/%')
);

-- UPDATE: Allow users to update files that start with their user ID
CREATE POLICY "csv_update_own" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND name LIKE (auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND name LIKE (auth.uid()::text || '/%')
);

-- DELETE: Allow users to delete files that start with their user ID
CREATE POLICY "csv_delete_own" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND name LIKE (auth.uid()::text || '/%')
);

-- Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  roles,
  'Policy created with LIKE pattern' as note
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'csv_%'
ORDER BY policyname;

-- Test the LIKE pattern (replace with your user ID to test)
SELECT 
  'Test 1: Own file' as test,
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv' LIKE 'da65c531-e4dd-41f0-a8e9-8c4eef221e00/%' as result,
  'Should be TRUE' as expected
UNION ALL
SELECT 
  'Test 2: Other user file' as test,
  'other-user-id/test.csv' LIKE 'da65c531-e4dd-41f0-a8e9-8c4eef221e00/%' as result,
  'Should be FALSE' as expected;
