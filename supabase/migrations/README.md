# Database Migrations

This folder contains the complete database schema for the Lead Management System.

## Fresh Setup

For a fresh project setup, only one migration file is needed:

- **`00_complete_schema.sql`** - Complete database schema including:
  - Users table with RBAC (Role-Based Access Control)
  - Lead buckets and custom fields
  - Leads table with all necessary fields
  - Import jobs tracking
  - Performance indexes
  - Storage bucket configuration
  - Helper functions (bulk assign, filter counts, etc.)
  - Realtime configuration
  - All necessary RLS policies

## How to Apply

### For New Projects

1. Create a new Supabase project
2. Set up your environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Run the migration:
   ```bash
   npx supabase db push
   ```

### For Existing Projects

If you already have the database set up, this migration is idempotent and safe to run. It uses `IF NOT EXISTS` and `DROP POLICY IF EXISTS` to avoid conflicts.

## Post-Migration Steps

1. **Set Admin User**: Update the email in the migration file (line with `rds2197@gmail.com`) to your admin email before running
2. **Enable Realtime** (Optional): Go to Supabase Dashboard → Database → Replication → Enable `leads` table
3. **Verify Setup**: Check that all tables, functions, and policies are created correctly

## Key Features

- **Optimized Filter Counts**: Database-level aggregation function for fast faceted search
- **Realtime Updates**: Configured for real-time lead updates (requires dashboard activation)
- **Flexible Schema**: No strict constraints on gender and other fields for CSV import flexibility
- **Performance Indexes**: Optimized indexes on all filterable and searchable fields
- **Secure RLS**: Row-level security policies for multi-user access control

## Troubleshooting

If you encounter issues:
- Ensure you're logged in: `npx supabase login`
- Link to your project: `npx supabase link --project-ref your-project-ref`
- Check migration status: `npx supabase db diff`
