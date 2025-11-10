-- Simplified Storage RLS Fix
-- This allows authenticated users to upload files to their own folders

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'csv-imports', 
  'csv-imports', 
  false,
  52428800, -- 50MB limit
  ARRAY['text/csv', 'application/vnd.ms-excel', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['text/csv', 'application/vnd.ms-excel', 'text/plain'];

-- Drop all existing policies
DROP POLICY IF EXISTS "csv_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_select_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_update_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_delete_own" ON storage.objects;

-- Create simple policies that allow authenticated users to manage their own files
-- INSERT: Allow users to upload to their own folder
CREATE POLICY "csv_insert_own" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: Allow users to read from their own folder
CREATE POLICY "csv_select_own" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Allow users to update files in their own folder
CREATE POLICY "csv_update_own" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Allow users to delete files from their own folder
CREATE POLICY "csv_delete_own" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'csv-imports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'csv_%'
ORDER BY policyname;
