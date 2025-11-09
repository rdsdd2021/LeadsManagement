# Quick Install: Bulk Assignment Feature

## 1. Install Dependencies

```bash
npm install @radix-ui/react-radio-group @radix-ui/react-select
```

## 2. Apply SQL Migration

Copy and run this in Supabase SQL Editor:

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

## 3. Restart Dev Server

```bash
npm run dev
```

## Done!

- Admins will see checkboxes and "Bulk Assign" button
- Regular users will only see their assigned leads
- Test by logging in as admin and assigning leads
