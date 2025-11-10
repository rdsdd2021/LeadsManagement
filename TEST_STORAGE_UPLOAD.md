# Test Storage Upload Issue

## Step 1: Run Diagnostic Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the script in `supabase/migrations/diagnose_storage_issue.sql`
3. Check the results:
   - Does the bucket exist?
   - Are the policies showing up?
   - What is your current user ID?

## Step 2: Verify User ID in Browser

Open your browser console (F12) and run:

```javascript
// Get current user
const { data: { user } } = await supabase.auth.getUser()
console.log('User ID:', user?.id)
console.log('User Email:', user?.email)

// Test file path
const testPath = `${user.id}/test.csv`
console.log('Test Path:', testPath)

// Check if path matches expected format
console.log('Path starts with user ID:', testPath.startsWith(user.id))
```

Expected output:
```
User ID: da65c531-e4dd-41f0-a8e9-8c4eef221e00
User Email: rds2197@gmail.com
Test Path: da65c531-e4dd-41f0-a8e9-8c4eef221e00/test.csv
Path starts with user ID: true
```

## Step 3: Test Upload Manually

In browser console:

```javascript
// Create a test file
const testContent = 'name,email\nTest,test@example.com'
const testFile = new File([testContent], 'test.csv', { type: 'text/csv' })

// Get user
const { data: { user } } = await supabase.auth.getUser()
const filePath = `${user.id}/${Date.now()}_test.csv`

console.log('Attempting upload to:', filePath)

// Try upload
const { data, error } = await supabase.storage
  .from('csv-imports')
  .upload(filePath, testFile, {
    cacheControl: '3600',
    upsert: false
  })

if (error) {
  console.error('Upload failed:', error)
} else {
  console.log('Upload successful:', data)
}
```

## Step 4: Apply Simple Fix

If the diagnostic shows issues, run the simplified fix:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run `supabase/migrations/fix_storage_rls_simple.sql`
3. Verify the output shows 4 policies created
4. Try uploading again

## Common Issues & Solutions

### Issue 1: "Bucket not found"
**Solution:** The bucket doesn't exist. Run:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('csv-imports', 'csv-imports', false)
ON CONFLICT (id) DO NOTHING;
```

### Issue 2: "No policies found"
**Solution:** Policies weren't created. Run the simple fix script.

### Issue 3: "User ID is null"
**Solution:** User is not authenticated. Check:
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

### Issue 4: "Path doesn't match policy"
**Solution:** The file path format is wrong. It should be:
```
{user-id}/{timestamp}_{filename}
```

### Issue 5: "RLS is not enabled"
**Solution:** Enable RLS on storage.objects:
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### Issue 6: "Policy check fails even with correct path"
**Solution:** The `storage.foldername()` function might not be working. Try this alternative policy:

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

## Step 5: Alternative - Temporary Permissive Policy

If nothing works, temporarily use a more permissive policy for testing:

```sql
-- TEMPORARY: Allow all authenticated users to upload
DROP POLICY IF EXISTS "csv_insert_temp" ON storage.objects;

CREATE POLICY "csv_insert_temp" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'csv-imports');

-- TEMPORARY: Allow all authenticated users to read
DROP POLICY IF EXISTS "csv_select_temp" ON storage.objects;

CREATE POLICY "csv_select_temp" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'csv-imports');
```

⚠️ **Warning:** This allows any authenticated user to access any file in the bucket. Only use for testing!

## Step 6: Check Supabase Client Auth

Verify the Supabase client is using the authenticated session:

```javascript
// In browser console
const session = await supabase.auth.getSession()
console.log('Has session:', !!session.data.session)
console.log('Access token:', session.data.session?.access_token?.substring(0, 20) + '...')

// Check if storage requests include auth header
const { data, error } = await supabase.storage
  .from('csv-imports')
  .list(user.id)

console.log('List result:', { data, error })
```

## Expected Behavior

After applying the fix:
1. ✅ User can upload files to `{user-id}/` folder
2. ✅ User can list files in their folder
3. ✅ User can delete their own files
4. ❌ User cannot access other users' files
5. ❌ Anonymous users cannot upload

## Need More Help?

If still failing:
1. Share the output from the diagnostic script
2. Share the browser console output from Step 2
3. Check Supabase logs in Dashboard → Logs → Storage
