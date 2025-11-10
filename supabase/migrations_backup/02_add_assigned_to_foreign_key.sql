-- Add foreign key constraint for assigned_to field
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;

ALTER TABLE public.leads
ADD CONSTRAINT leads_assigned_to_fkey
FOREIGN KEY (assigned_to)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_fkey ON public.leads(assigned_to);
