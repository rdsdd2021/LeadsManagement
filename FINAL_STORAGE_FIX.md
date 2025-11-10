# Final Storage Upload Fix

## The Real Problem

After analyzing your error, the issue is that the RLS policies are checking correctly, but there might be a mismatch in how the user ID is being compared. Let's fix this definitively.

## Quick Fix - Run This SQL

Copy and paste this into **Supabase Dashboard → SQL Editor** and click **Run**:

```sql
-- Step 1: Ensure bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'csv-imports', 
  'csv-imports', 
  false,
  52428800,
  ARRAY['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/csv']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Drop ALL existing policies (clean slate)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
          AND policyname LIKE 'csv_%'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- Step 3: Create new policies with explicit role and simpler checks
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

-- Step 4: Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'csv_%'
ORDER BY policyname;
```

## What Changed?

Instead of using `storage.foldername()` function which might have issues, we're using a regex pattern:
- `name ~ ('^' || auth.uid()::text || '/')` 
- This checks if the file path starts with the user's ID followed by a slash

## Test It

After running the SQL, test in your browser console (F12):

```javascript
// Get user
const { data: { user } } = await supabase.auth.getUser()
console.log('Testing upload for user:', user.id)

// Create test file
const testFile = new File(['test'], 'test.csv', { type: 'text/csv' })
const filePath = `${user.id}/${Date.now()}_test.csv`

// Upload
const { data, error } = await supabase.storage
  .from('csv-imports')
  .upload(filePath, testFile)

console.log('Result:', { data, error })
```

## If Still Failing

Run this diagnostic to see what's happening:

```sql
-- Check current user
SELECT 
  auth.uid() as my_user_id,
  auth.role() as my_role;

-- Test the regex pattern
SELECT 
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv' as test_path,
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv' ~ ('^' || 'da65c531-e4dd-41f0-a8e9-8c4eef221e00' || '/') as pattern_matches;

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
```

## Nuclear Option (Last Resort)

If nothing works, temporarily disable RLS for testing:

```sql
-- ⚠️ WARNING: This makes the bucket accessible to all authenticated users!
-- Only use for testing, then re-enable with proper policies

ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Test your upload

-- Then re-enable:
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## Success Indicators

After the fix, you should see:
1. ✅ 4 policies listed in the verification query
2. ✅ Each policy shows "authenticated" in roles column
3. ✅ Upload test succeeds with `{ data: {...}, error: null }`
4. ✅ Your CSV upload in the app works

Let me know the results!
