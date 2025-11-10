-- Fix Storage RLS Using Regex Pattern Matching
-- This is more reliable than storage.foldername()

-- Drop existing policies
DROP POLICY IF EXISTS "csv_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_select_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_update_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_delete_own" ON storage.objects;

-- Create policies using regex pattern matching
-- Pattern: name must start with user_id followed by /

CREATE POLICY "csv_insert_own" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND name ~ ('^' || auth.uid()::text || '/')
);

CREATE POLICY "csv_select_own" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND name ~ ('^' || auth.uid()::text || '/')
);

CREATE POLICY "csv_update_own" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND name ~ ('^' || auth.uid()::text || '/')
)
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND name ~ ('^' || auth.uid()::text || '/')
);

CREATE POLICY "csv_delete_own" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND name ~ ('^' || auth.uid()::text || '/')
);

-- Verify the policies
SELECT 
  policyname,
  cmd,
  roles,
  'Created successfully' as status
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'csv_%'
ORDER BY policyname;
