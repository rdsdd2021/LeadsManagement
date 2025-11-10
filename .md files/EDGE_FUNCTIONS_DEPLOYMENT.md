# Edge Functions Deployment Guide

## Overview
Your bulk operations now use Supabase Edge Functions for better performance and scalability. Edge functions run on the server and can handle unlimited data without client-side limitations.

## What Changed

### 1. Bulk Assign (useBulkAssign.ts)
- ✅ Already using edge function by default (`USE_EDGE_FUNCTION = true`)
- Fetches lead IDs in batches of 1000 (no 10k limit)
- Uses correct field names: school, district, gender, stream

### 2. Bulk Delete (useBulkDelete.ts)
- ✅ Now using edge function by default (`USE_EDGE_FUNCTION = true`)
- Automatically chooses edge function for bulk counts or client-side for specific IDs
- Fetches lead IDs in batches of 1000 (no 10k limit)

## Deployment Steps

### 1. Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Deploy Edge Functions
```bash
# Deploy bulk assign function
supabase functions deploy bulk-assign-leads

# Deploy bulk delete function
supabase functions deploy bulk-delete-leads
```

### 5. Verify Deployment
Check your Supabase dashboard:
- Go to Edge Functions section
- You should see both functions listed
- Check the logs to ensure they're working

## Testing

### Test Bulk Assign
1. Select 2000+ leads using "Select Leads" button
2. Click "Bulk Actions" → "Assign to Users"
3. Distribute leads among users
4. Check terminal/console for logs showing batch fetching

### Test Bulk Delete
1. Select 1500+ leads using "Select Leads" button
2. Click "Bulk Actions" → "Delete"
3. Confirm deletion
4. Check terminal/console for logs showing batch fetching

## Benefits

✅ **No Row Limits** - Can process millions of leads
✅ **Server-Side Processing** - Faster and more reliable
✅ **Batch Processing** - Fetches data in 1000-row chunks
✅ **Better Performance** - Reduces client-side load
✅ **Automatic Filtering** - Respects all active filters

## Troubleshooting

### Edge Function Not Found
- Make sure you deployed the functions
- Check your Supabase project URL in `.env.local`

### Authentication Errors
- Ensure user is logged in
- Check that user has admin role

### Timeout Issues
- Edge functions have a 60-second timeout
- For very large operations (100k+ leads), consider breaking into smaller batches

## Monitoring

Check edge function logs in Supabase dashboard:
1. Go to Edge Functions
2. Click on function name
3. View "Logs" tab
4. Look for:
   - `📦 Fetched X IDs (total: Y/Z)` - Batch progress
   - `✅ Successfully assigned/deleted X leads` - Success
   - `❌ Error` - Any failures
