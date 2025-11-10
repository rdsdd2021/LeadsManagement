# Fix CSV Upload Error - RLS Policy Violation

## Problem
Getting `403 Unauthorized` error with message: `"new row violates row-level security policy"` when uploading CSV files.

## Root Cause
The Row-Level Security (RLS) policies for the `csv-imports` storage bucket are either:
1. Not applied to your Supabase instance
2. Missing the `TO authenticated` clause
3. Not granting proper permissions

## Solution

### Option 1: Apply via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix Script**
   - Copy the contents of `supabase/migrations/fix_storage_rls.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify the Bucket**
   - Go to "Storage" in the left sidebar
   - You should see the `csv-imports` bucket
   - Click on it to verify it's set to "Private"

### Option 2: Apply via Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push

# Or run the specific migration
supabase db execute --file supabase/migrations/fix_storage_rls.sql
```

### Option 3: Manual Setup via Dashboard

1. **Go to Storage Settings**
   - Navigate to Storage → Policies
   - Select the `csv-imports` bucket

2. **Create INSERT Policy**
   ```sql
   CREATE POLICY "csv_insert_own" ON storage.objects 
   FOR INSERT 
   TO authenticated
   WITH CHECK (
     bucket_id = 'csv-imports' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

3. **Create SELECT Policy**
   ```sql
   CREATE POLICY "csv_select_own" ON storage.objects 
   FOR SELECT 
   TO authenticated
   USING (
     bucket_id = 'csv-imports' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

4. **Create UPDATE Policy**
   ```sql
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
   ```

5. **Create DELETE Policy**
   ```sql
   CREATE POLICY "csv_delete_own" ON storage.objects 
   FOR DELETE 
   TO authenticated
   USING (
     bucket_id = 'csv-imports' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

## How It Works

The RLS policies ensure that:
- Users can only upload files to folders named with their user ID
- File path format: `{user_id}/{timestamp}_{filename}.csv`
- Example: `da65c531-e4dd-41f0-a8e9-8c4eef221e00/1762810040370_sample_leads.csv`

The policy checks:
```sql
auth.uid()::text = (storage.foldername(name))[1]
```

This extracts the first folder name from the file path and compares it to the authenticated user's ID.

## Verification

After applying the fix, test the upload:

1. **Log in to your app**
2. **Go to CSV Upload page**
3. **Select a CSV file**
4. **Click Upload**

You should see:
- ✅ File uploads successfully
- ✅ Progress bar completes
- ✅ Import job starts processing

## Troubleshooting

### Still getting 403 error?

1. **Check Authentication**
   ```javascript
   // In browser console
   const { data: { user } } = await supabase.auth.getUser()
   console.log('User ID:', user?.id)
   ```

2. **Verify File Path**
   - Check that the file path starts with your user ID
   - Format should be: `{user_id}/{filename}`

3. **Check Bucket Permissions**
   ```sql
   -- Run in SQL Editor
   SELECT * FROM storage.buckets WHERE id = 'csv-imports';
   ```
   - Should show `public = false`

4. **List Active Policies**
   ```sql
   -- Run in SQL Editor
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage';
   ```

5. **Test Policy Directly**
   ```sql
   -- Run in SQL Editor (replace with your user ID)
   SELECT auth.uid()::text;
   ```

### Error: "Bucket not found"

Create the bucket manually:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('csv-imports', 'csv-imports', false)
ON CONFLICT (id) DO NOTHING;
```

### Error: "Permission denied"

Grant permissions:
```sql
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
```

## Additional Notes

- The `csv-imports` bucket is private (not publicly accessible)
- Each user can only access their own files
- Files are automatically organized by user ID
- Old files can be cleaned up with a scheduled job

## Need More Help?

Check these resources:
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
