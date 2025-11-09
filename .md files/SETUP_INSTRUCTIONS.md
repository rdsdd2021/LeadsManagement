# Setup Instructions for RBAC Authentication

## Current Status
✅ Authentication is working
✅ Login page is functional
❌ Users table needs to be created in Supabase

## Quick Setup Steps

### 1. Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ulhlebdgvrnwafahgzhz`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/001_rbac_setup_simple.sql`
6. Paste it into the SQL editor
7. Click **Run** or press `Ctrl+Enter`

### 2. Verify the Setup

After running the migration, verify:

```sql
-- Check if users table exists
SELECT * FROM public.users;

-- Check your user's role
SELECT email, role FROM public.users WHERE email = 'rds2197@gmail.com';
```

You should see your user with the role 'admin'.

### 3. Test the Login

1. Go to http://localhost:3001
2. You'll be redirected to the login page
3. Enter credentials:
   - Email: `rds2197@gmail.com`
   - Password: `B@ssDr0p`
4. Click "Sign In"
5. You should be redirected to the dashboard with your role badge showing "ADMIN"

## User Roles

The system has 4 roles with different permissions:

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **Admin** | Full Access | Everything + user management |
| **Manager** | High Access | View, create, update, delete leads |
| **Sales Rep** | Limited Access | View and update assigned leads only |
| **Viewer** | Read Only | View all leads |

## Adding New Users

### Option 1: Via Supabase Dashboard
1. Go to Authentication > Users
2. Click "Add User"
3. Enter email and password
4. After creation, run SQL to set role:
```sql
UPDATE public.users 
SET role = 'manager'  -- or 'admin', 'sales_rep', 'viewer'
WHERE email = 'newuser@example.com';
```

### Option 2: Via SQL
```sql
-- This will be handled automatically by the trigger
-- Just create the auth user and the trigger will create the users table entry
```

## Troubleshooting

### Issue: "404 error on users table"
**Solution:** Run the migration SQL in Supabase dashboard

### Issue: "User role is always 'viewer'"
**Solution:** Update the role in the users table:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

### Issue: "Can't see leads after login"
**Solution:** Make sure you've run the leads table migration and have RLS policies set up

## Next Steps

After setup is complete:
1. ✅ Test login with different roles
2. ✅ Verify role-based access control
3. ✅ Test lead management features
4. ✅ Add more users with different roles
