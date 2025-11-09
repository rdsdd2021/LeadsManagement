# 🚀 Bulk Lead Assignment - Quick Start

## What You Get

✅ **Bulk Selection** - Select leads individually or all at once
✅ **Smart Assignment** - Distribute leads equally or with custom counts
✅ **Row-Level Security** - Users see only their assigned leads
✅ **Admin Controls** - Full control for admins, restricted for users

## 3-Step Setup

### Step 1: Install Dependencies (30 seconds)

```bash
npm install @radix-ui/react-radio-group @radix-ui/react-select
```

### Step 2: Apply Database Migration (1 minute)

Open Supabase SQL Editor and run:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their assigned leads" ON leads;
DROP POLICY IF EXISTS "Users can update their assigned leads" ON leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;

CREATE POLICY "Users can view their assigned leads"
ON leads FOR SELECT TO authenticated
USING (
  assigned_to = auth.uid()::text 
  OR assigned_to IS NULL
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
);

CREATE POLICY "Users can update their assigned leads"
ON leads FOR UPDATE TO authenticated
USING (
  assigned_to = auth.uid()::text
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin')
);

CREATE POLICY "Admins can insert leads"
ON leads FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin'));

CREATE POLICY "Admins can delete leads"
ON leads FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid()::text AND users.role = 'admin'));
```

### Step 3: Restart Server (10 seconds)

```bash
npm run dev
```

## ✨ You're Done!

### As Admin:
1. Go to leads page
2. Apply filters (e.g., status, category)
3. Click "Bulk Assign" button
4. Enter count (e.g., 500 leads)
5. Select users
6. Choose equal or custom distribution
7. Confirm!

### As Regular User:
- See only your assigned leads
- Update your leads
- No bulk operations

## Example Use Case

**Scenario**: You have 3400 filtered leads, want to assign 500

1. Apply filters → 3400 results
2. Click "Bulk Assign"
3. Enter "500" as count
4. Select 5 users
5. Choose "Equal distribution"
6. Preview: 100 leads each
7. Confirm → Done!

## Files Created

- ✅ `components/leads/BulkAssignDialog.tsx` - Assignment dialog
- ✅ `hooks/useBulkAssign.ts` - Assignment logic
- ✅ `components/ui/radio-group.tsx` - Radio buttons
- ✅ `components/ui/select.tsx` - Dropdowns
- ✅ `app/page.tsx` - Updated with selection UI
- ✅ `hooks/useLeads.ts` - Updated with RLS

## Need Help?

- **Full Guide**: See `BULK_ASSIGNMENT_SETUP.md`
- **Summary**: See `BULK_ASSIGNMENT_SUMMARY.md`
- **SQL Only**: See `supabase/migrations/20240110_bulk_assignment_rls.sql`

## Troubleshooting

**"Bulk Assign" button not showing?**
→ Make sure you're logged in as admin

**Assignment fails?**
→ Check SQL migration was applied

**Users see all leads?**
→ Verify RLS is enabled: `ALTER TABLE leads ENABLE ROW LEVEL SECURITY;`

**TypeScript errors?**
→ Run `npm install @radix-ui/react-radio-group @radix-ui/react-select`

---

**That's it! You now have a complete bulk assignment system.** 🎉
