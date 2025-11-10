-- Role-Based Access Control for Leads
-- Admin and Manager: See all leads
-- Sales Rep and Viewer: Only see leads assigned to them

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads" ON public.leads;

-- Enable RLS (if not already enabled)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Admin/Manager see all, Sales Rep/Viewer see only assigned
CREATE POLICY "Role-based lead viewing"
ON public.leads
FOR SELECT
TO authenticated
USING (
  -- Get user role from users table
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (
      -- Admin and Manager can see all leads
      users.role IN ('admin', 'manager')
      OR
      -- Sales Rep and Viewer can only see leads assigned to them
      (users.role IN ('sales_rep', 'viewer') AND leads.assigned_to = auth.uid())
    )
  )
);

-- INSERT Policy: Admin and Manager can insert, Sales Rep cannot
CREATE POLICY "Role-based lead insertion"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'manager')
  )
);

-- UPDATE Policy: Admin/Manager can update all, Sales Rep can update only assigned
CREATE POLICY "Role-based lead updating"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (
      -- Admin and Manager can update all leads
      users.role IN ('admin', 'manager')
      OR
      -- Sales Rep can only update leads assigned to them
      (users.role = 'sales_rep' AND leads.assigned_to = auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (
      users.role IN ('admin', 'manager')
      OR
      (users.role = 'sales_rep' AND leads.assigned_to = auth.uid())
    )
  )
);

-- DELETE Policy: Only Admin and Manager can delete
CREATE POLICY "Role-based lead deletion"
ON public.leads
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'manager')
  )
);

-- Add helpful comments
COMMENT ON POLICY "Role-based lead viewing" ON public.leads IS 
  'Admin/Manager see all leads, Sales Rep/Viewer see only assigned leads';

COMMENT ON POLICY "Role-based lead insertion" ON public.leads IS 
  'Only Admin and Manager can create new leads';

COMMENT ON POLICY "Role-based lead updating" ON public.leads IS 
  'Admin/Manager update all, Sales Rep updates only assigned leads';

COMMENT ON POLICY "Role-based lead deletion" ON public.leads IS 
  'Only Admin and Manager can delete leads';
