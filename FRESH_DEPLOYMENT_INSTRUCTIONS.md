# Fresh Deployment Instructions

## Overview
This guide will help you deploy the complete optimized schema to your Supabase database.

## What's Included in the Migration

The file `supabase/migrations/99999999999999_complete_optimized_schema.sql` contains:

### ✅ Optimized RLS Policies
- Helper functions: `is_admin()`, `is_admin_or_manager()`, `current_user_role()`
- Replaces expensive subqueries with cached function calls
- **10-100x faster** than inline subqueries

### ✅ All Tables
- `users` (with `name` column, not `full_name`)
- `lead_buckets` (lead templates)
- `custom_fields` (bucket-specific fields)
- `leads` (main data table)
- `import_jobs` (CSV import tracking)

### ✅ Performance Indexes
- Standard indexes on all filterable columns
- GIN indexes for JSONB custom_fields
- pg_trgm indexes for text search (name, phone)
- Role index for faster RLS checks

### ✅ Functions
- `get_filter_counts()` - Faceted search with counts
- `get_unique_values()` - Dropdown values
- `get_custom_field_unique_values()` - Custom field dropdowns
- `handle_new_user()` - Auto-create user profiles
- `update_updated_at_column()` - Timestamp triggers

### ✅ Storage
- `csv-imports` bucket with RLS policies

### ✅ Default Data
- General bucket pre-created

## Deployment Steps

### Option 1: Fresh Database (Recommended)

If you want to start completely fresh:

1. **Reset the database:**
   ```powershell
   supabase db reset --linked
   ```

2. **Delete old migration files:**
   ```powershell
   Remove-Item supabase/migrations/0*.sql
   Remove-Item supabase/migrations/20*.sql -Exclude *99999999999999*
   ```

3. **Rename the comprehensive migration:**
   ```powershell
   Rename-Item supabase/migrations/99999999999999_complete_optimized_schema.sql 00000000000000_complete_schema.sql
   ```

4. **Push the migration:**
   ```powershell
   supabase db push --linked
   ```

### Option 2: Apply to Existing Database

If you want to keep existing data:

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click on "SQL Editor"

2. **Copy and paste the migration:**
   - Open `supabase/migrations/99999999999999_complete_optimized_schema.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify:**
   ```sql
   -- Check functions exist
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('is_admin', 'is_admin_or_manager', 'get_filter_counts', 'get_unique_values');
   
   -- Check tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'leads', 'lead_buckets', 'custom_fields', 'import_jobs');
   
   -- Check indexes exist
   SELECT indexname FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename = 'leads';
   ```

## After Deployment

### 1. Create Admin User

Go to Supabase Dashboard → Authentication → Users → Add user

Then set their role:
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 2. Test the Application

1. Clear browser cache and localStorage
2. Log in with your admin user
3. Test:
   - Page navigation (should be fast, no stuck loading)
   - Filters (should load quickly)
   - CSV import
   - Lead assignment

### 3. Verify Performance

Check your logs - you should see:
- Page loads: <500ms (was 1.6s)
- API calls: <200ms (was 1.2s)
- No "getUserRole timeout" errors
- No stuck loading states

## Troubleshooting

### If you see "column users_1.full_name does not exist"
- The code has been updated to use `name` instead of `full_name`
- Make sure you've pulled the latest code changes

### If pages still get stuck loading
- Clear browser cache and localStorage
- Check that the helper functions were created successfully
- Verify RLS policies are using the helper functions

### If filters are slow
- Check that indexes were created: `\di public.idx_leads_*`
- Verify pg_trgm extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_trgm';`

### If CSV import fails
- Check storage bucket exists: `SELECT * FROM storage.buckets WHERE id = 'csv-imports';`
- Verify storage policies: `SELECT * FROM storage.policies WHERE bucket_id = 'csv-imports';`

## What Changed from Old Migrations

### Schema Changes
- `users.full_name` → `users.name`
- `import_jobs.successful_rows` → `import_jobs.success_count`
- `import_jobs.failed_rows` → `import_jobs.failed_count`
- `import_jobs.error_log` → `import_jobs.errors`
- Added `import_jobs.started_at` and `completed_at`
- Added `leads.created_by`

### Performance Improvements
- RLS policies now use helper functions instead of subqueries
- Added role index on users table
- Added pg_trgm indexes for text search
- Filter functions use SECURITY INVOKER (respects RLS)

### Function Changes
- All functions now use `SECURITY INVOKER` to respect RLS
- Filter counts function optimized for faceted search
- Added unique values functions for dropdowns

## Files to Keep

After successful deployment, you can archive these old files:
- `supabase/migrations/00_complete_schema.sql` (old)
- `supabase/migrations/01-09_*.sql` (incremental fixes)
- `supabase/migrations/20241109000000_*.sql` (old updates)
- `supabase/migrations/20250110000000_*.sql` (old RBAC)
- `supabase/migrations/20250110000001_*.sql` (old optimization)

Keep only:
- `supabase/migrations/99999999999999_complete_optimized_schema.sql` (or renamed to 00000000000000)

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs for slow queries
3. Verify all functions and indexes were created
4. Test with a fresh incognito window
