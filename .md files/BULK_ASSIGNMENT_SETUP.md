# Bulk Lead Assignment Feature - Setup Guide

## Overview

This feature allows admins to:
- Select leads in bulk (current page or all filtered results)
- Specify how many leads to assign
- Distribute leads equally or with custom counts per user
- Users see only their assigned leads (RLS enforced)

## Step 1: Apply Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their assigned leads" ON leads;
DROP POLICY IF EXISTS "Users can update their assigned leads" ON leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;

-- Policy: Users can view leads assigned to them OR leads with no assignment
-- Admins can view all leads
CREATE POLICY "Users can view their assigned leads"
ON leads FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid()::text 
  OR assigned_to IS NULL
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'admin'
  )
);

-- Policy: Users can update their assigned leads
CREATE POLICY "Users can update their assigned leads"
ON leads FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'admin'
  )
);

-- Policy: Admins can insert leads
CREATE POLICY "Admins can insert leads"
ON leads FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'admin'
  )
);

-- Policy: Admins can delete leads
CREATE POLICY "Admins can delete leads"
ON leads FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'admin'
  )
);

-- Function to bulk assign leads
CREATE OR REPLACE FUNCTION bulk_assign_leads(
  lead_ids TEXT[],
  user_id TEXT
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can bulk assign leads';
  END IF;

  -- Update leads
  UPDATE leads
  SET 
    assigned_to = user_id,
    updated_at = NOW()
  WHERE id = ANY(lead_ids);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION bulk_assign_leads(TEXT[], TEXT) TO authenticated;
```

## Step 2: Install Required Dependencies

```bash
npm install @radix-ui/react-radio-group @radix-ui/react-select
```

## Step 3: Restart Development Server

```bash
npm run dev
```

## Features

### 1. Bulk Selection
- **Select All on Page**: Checkbox in table header selects all visible leads
- **Individual Selection**: Click checkbox on each row
- **Selection Counter**: Shows how many leads are selected

### 2. Bulk Assignment Dialog

#### Step 1: Specify Count
- Input field to specify how many leads to assign
- Defaults to total filtered count
- If leads are selected, defaults to selection count
- Maximum is the total filtered count

#### Step 2: Distribution
Two modes:

**Equal Distribution (Automatic)**
- Select users from the list
- Leads are distributed equally
- Remainder distributed to first users
- Example: 100 leads, 3 users = 34, 33, 33

**Custom Count Per User**
- Select users and specify count for each
- Total must not exceed available leads
- Validation prevents over-assignment

### 3. Row-Level Security (RLS)

**For Regular Users:**
- See only leads assigned to them
- See unassigned leads
- Can update their assigned leads

**For Admins:**
- See all leads
- Can assign/reassign leads
- Can perform bulk operations
- Can create/delete leads

### 4. Assignment Process

1. Admin applies filters (status, category, region, custom fields, etc.)
2. Clicks "Bulk Assign" button
3. Specifies how many leads to assign
4. Selects users and distribution mode
5. Reviews distribution preview
6. Confirms assignment
7. Leads are assigned in order (newest first)
8. Table refreshes automatically

## Usage Examples

### Example 1: Equal Distribution
```
Filtered Results: 3400 leads
Assign Count: 500
Selected Users: 5
Distribution: 100 leads each
```

### Example 2: Custom Distribution
```
Filtered Results: 3400 leads
Assign Count: 500
User A: 200 leads
User B: 150 leads
User C: 150 leads
Total: 500 leads
```

### Example 3: Page Selection
```
Current Page: 100 leads
Selected: 50 leads (manually selected)
Assign Count: 50 (auto-filled)
Distribution: Assign only those 50 leads
```

## Performance Considerations

- Bulk operations are optimized with single UPDATE queries
- Maximum 10,000 leads per assignment (configurable)
- RLS policies use indexed columns (assigned_to, role)
- Pagination prevents loading all data at once

## Testing Checklist

- [ ] Admin can see "Bulk Assign" button
- [ ] Regular users don't see bulk assign features
- [ ] Selection works (individual and select all)
- [ ] Dialog opens with correct counts
- [ ] Equal distribution calculates correctly
- [ ] Custom distribution validates totals
- [ ] Assignment completes successfully
- [ ] Table refreshes after assignment
- [ ] Regular users see only their leads
- [ ] Admins see all leads

## Troubleshooting

**Issue: "Bulk Assign" button not visible**
- Check user role is 'admin'
- Verify authentication is working

**Issue: Assignment fails**
- Check RLS policies are applied
- Verify bulk_assign_leads function exists
- Check user has admin role

**Issue: Users see all leads**
- Verify RLS is enabled on leads table
- Check policies are created correctly
- Ensure assigned_to column exists

**Issue: Performance slow**
- Check database indexes on assigned_to
- Reduce assignment count
- Check network latency

## Future Enhancements

- [ ] Assignment history/audit log
- [ ] Reassignment capability
- [ ] Bulk unassign
- [ ] Assignment by team
- [ ] Email notifications on assignment
- [ ] Assignment rules/automation
- [ ] Load balancing (assign to least busy user)
