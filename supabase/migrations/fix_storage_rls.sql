-- Fix Storage RLS Policies for CSV Imports
-- This ensures users can upload files to their own folders

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('csv-imports', 'csv-imports', false)
ON CONFLICT (id) DO UPDATE SET
  public = false;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "csv_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_select_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_update_own" ON storage.objects;
DROP POLICY IF EXISTS "csv_delete_own" ON storage.objects;

-- Allow authenticated users to INSERT files into their own folder
CREATE POLICY "csv_insert_own" ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'csv-imports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to SELECT files from their own folder
CREATE POLICY "csv_select_own" ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'csv-imports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to UPDATE files in their own folder
CREATE POLICY "csv_update_own" ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'csv-imports' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'csv-imports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to DELETE files from their own folder
CREATE POLICY "csv_delete_own" ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'csv-imports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
