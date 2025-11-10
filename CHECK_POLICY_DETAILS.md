# Check Policy Details

## Run This Query

Run this in Supabase SQL Editor to see the EXACT policy conditions:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_condition,
  with_check::text as with_check_condition
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'csv_insert_own';
```

## What to Look For

The `with_check_condition` should show something like:

**Current (might be broken):**
```
((bucket_id = 'csv-imports'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))
```

**Should be (working):**
```
((bucket_id = 'csv-imports'::text) AND (name ~ ('^'::text || ((auth.uid())::text || '/'::text))))
```

## If It Shows the Old Condition

Run the regex fix:

```sql
-- Use regex pattern instead of storage.foldername
DROP POLICY IF EXISTS "csv_insert_own" ON storage.objects;

CREATE POLICY "csv_insert_own" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND name ~ ('^' || auth.uid()::text || '/')
);
```

## Test the Pattern

After updating, test if the pattern works:

```sql
-- Replace with your actual user ID
SELECT 
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv' as path,
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv' ~ ('^da65c531-e4dd-41f0-a8e9-8c4eef221e00/') as should_be_true,
  'other-user-id/test.csv' ~ ('^da65c531-e4dd-41f0-a8e9-8c4eef221e00/') as should_be_false;
```

Expected result:
- `should_be_true`: `true`
- `should_be_false`: `false`

## Alternative: Use LIKE Instead of Regex

If regex doesn't work, try LIKE:

```sql
DROP POLICY IF EXISTS "csv_insert_own" ON storage.objects;

CREATE POLICY "csv_insert_own" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'csv-imports' 
  AND name LIKE (auth.uid()::text || '/%')
);
```

Test:
```sql
SELECT 
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv' LIKE 'da65c531-e4dd-41f0-a8e9-8c4eef221e00/%' as should_be_true,
  'other-user-id/test.csv' LIKE 'da65c531-e4dd-41f0-a8e9-8c4eef221e00/%' as should_be_false;
```
