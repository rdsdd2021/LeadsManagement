-- Add name field to users table

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT;

COMMENT ON COLUMN public.users.name IS 'User full name';

-- Update existing users to have a default name based on email
UPDATE public.users 
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL;
