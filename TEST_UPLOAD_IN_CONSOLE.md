# Test Upload in Browser Console

## Quick Test

Open your browser console (F12) on your app and run:

```javascript
// 1. Check authentication
const { data: { user }, error: userError } = await supabase.auth.getUser()
console.log('User:', user?.id, user?.email)
console.log('User Error:', userError)

// 2. Check session
const { data: { session }, error: sessionError } = await supabase.auth.getSession()
console.log('Has Session:', !!session)
console.log('Session Error:', sessionError)

// 3. Create test file
const testContent = 'name,phone\nTest User,1234567890'
const testFile = new File([testContent], 'test.csv', { type: 'text/csv' })

// 4. Create file path (MUST start with user ID)
const filePath = `${user.id}/${Date.now()}_test.csv`
console.log('Upload Path:', filePath)

// 5. Attempt upload
console.log('Attempting upload...')
const { data, error } = await supabase.storage
  .from('csv-imports')
  .upload(filePath, testFile, {
    cacheControl: '3600',
    upsert: false
  })

// 6. Check result
if (error) {
  console.error('❌ Upload FAILED:', error)
  console.error('Error details:', JSON.stringify(error, null, 2))
} else {
  console.log('✅ Upload SUCCESS:', data)
  console.log('File path:', data.path)
}
```

## Expected Output

**Success:**
```
User: da65c531-e4dd-41f0-a8e9-8c4eef221e00 rds2197@gmail.com
User Error: null
Has Session: true
Session Error: null
Upload Path: da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_test.csv
Attempting upload...
✅ Upload SUCCESS: { path: "da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810380954_test.csv", ... }
```

**If Still Failing:**
```
❌ Upload FAILED: { message: "new row violates row-level security policy", ... }
```

## If Still Failing - Check These

### 1. Verify Policy is Using LIKE

Run in SQL Editor:
```sql
SELECT 
  policyname,
  with_check::text as condition
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'csv_insert_own';
```

Should show:
```
((bucket_id = 'csv-imports'::text) AND (name ~~ ((auth.uid())::text || '/%'::text)))
```

Note: `~~` is the operator for LIKE in PostgreSQL

### 2. Test Policy Directly

```sql
-- This simulates what happens during upload
SELECT 
  auth.uid() as my_user_id,
  'csv-imports' = 'csv-imports' as bucket_matches,
  'da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv' LIKE (auth.uid()::text || '/%') as path_matches,
  ('csv-imports' = 'csv-imports' AND 'da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv' LIKE (auth.uid()::text || '/%')) as policy_should_allow;
```

All should be `true`

### 3. Check if Auth Token is Being Sent

In browser console:
```javascript
// Check if storage requests include auth header
const { data: listData, error: listError } = await supabase.storage
  .from('csv-imports')
  .list(user.id, { limit: 1 })

console.log('List result:', { listData, listError })
```

If this works but upload doesn't, there's an issue with the INSERT policy specifically.

### 4. Nuclear Option - Temporary Open Policy

**⚠️ WARNING: Only for testing!**

```sql
-- Temporarily allow all authenticated users to upload
DROP POLICY IF EXISTS "csv_insert_temp" ON storage.objects;

CREATE POLICY "csv_insert_temp" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'csv-imports');

-- Test upload, then remove this policy and restore the proper one
```

## After Successful Test

Once the console test works, your CSV upload in the app should also work. If console works but app doesn't, the issue is in the app code, not the policies.
