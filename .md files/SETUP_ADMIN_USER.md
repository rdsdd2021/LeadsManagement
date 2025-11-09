# Setup Admin User

## Issue
The database has no users in either `auth.users` or `public.users` tables.

## Solution: Create Admin User via Supabase Dashboard

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/ulhlebdgvrnwafahgzhz
2. Navigate to: **Authentication** > **Users**

### Step 2: Add User
Click the **"Add User"** button and fill in:

- **Email:** `rds2197@gmail.com`
- **Password:** `Ramanuj@2197` (or your preferred password)
- **Auto Confirm User:** ✅ **YES** (important!)
- **Email Confirm:** ✅ **YES**

Click **"Create User"**

### Step 3: Verify User Created
The user should now appear in the Users list with:
- Email: rds2197@gmail.com
- Status: Confirmed ✅

### Step 4: Set User as Admin
Run this SQL in the **SQL Editor**:

```sql
-- Insert user into public.users table and set as admin
INSERT INTO public.users (id, email, role, full_name)
SELECT 
  id,
  email,
  'admin' as role,
  'Admin User' as full_name
FROM auth.users
WHERE email = 'rds2197@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- Verify
SELECT * FROM public.users WHERE email = 'rds2197@gmail.com';
```

### Step 5: Test Login
1. Go to: http://localhost:3000/login
2. Email: `rds2197@gmail.com`
3. Password: (the password you set in Step 2)
4. Click **Sign In**

You should now be logged in as an admin!

---

## Alternative: Create User via SQL (Advanced)

If you prefer to create the user via SQL, you can use the Supabase Auth Admin API:

### Using SQL Editor with Service Role:

```sql
-- This requires service_role permissions
-- Run in Supabase SQL Editor

-- Create auth user
SELECT extensions.create_user(
  email := 'rds2197@gmail.com',
  password := 'Ramanuj@2197',
  email_confirm := true
);

-- Then insert into public.users
INSERT INTO public.users (id, email, role, full_name)
SELECT 
  id,
  email,
  'admin' as role,
  'Admin User' as full_name
FROM auth.users
WHERE email = 'rds2197@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

---

## Verification Checklist

After creating the user, verify:

- [ ] User exists in `auth.users` table
- [ ] User exists in `public.users` table
- [ ] User role is set to `'admin'`
- [ ] User can login at http://localhost:3000/login
- [ ] User can access http://localhost:3000/import-leads
- [ ] User can access http://localhost:3000/manage-buckets
- [ ] User can access http://localhost:3000/manage-users

---

## Quick Test

After creating the user, run this SQL to verify everything:

```sql
-- Check auth user
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'rds2197@gmail.com';

-- Check public user
SELECT id, email, role, created_at 
FROM public.users 
WHERE email = 'rds2197@gmail.com';

-- Should return:
-- auth.users: 1 row with confirmed email
-- public.users: 1 row with role = 'admin'
```

---

## Next Steps

Once the admin user is created:

1. ✅ Login to the application
2. ✅ Create the "Seminar" bucket (if not exists)
3. ✅ Test CSV import feature
4. ✅ Create additional users via Manage Users page

---

**Dashboard URL:** https://supabase.com/dashboard/project/ulhlebdgvrnwafahgzhz/auth/users
