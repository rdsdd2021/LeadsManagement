-- Migration: Add role-based filtering to get_unique_values function
-- This ensures sales reps only see unique values from their assigned leads

-- Drop the old function
DROP FUNCTION IF EXISTS public.get_unique_values();

-- Create new function with p_user_id parameter for role-based filtering
CREATE OR REPLACE FUNCTION public.get_unique_values(
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
  v_schools jsonb;
  v_districts jsonb;
  v_genders jsonb;
  v_streams jsonb;
  v_user_role text;
BEGIN
  -- Determine user role (admin sees all, sales_rep sees only assigned)
  IF p_user_id IS NULL THEN
    v_user_role := 'admin';
  ELSE
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = p_user_id;
    
    -- Default to sales_rep if role not found
    v_user_role := COALESCE(v_user_role, 'sales_rep');
  END IF;

  -- Get unique schools (with role-based filtering)
  IF v_user_role = 'admin' THEN
    SELECT jsonb_agg(DISTINCT school ORDER BY school) INTO v_schools
    FROM public.leads 
    WHERE school IS NOT NULL AND school != '';
  ELSE
    SELECT jsonb_agg(DISTINCT school ORDER BY school) INTO v_schools
    FROM public.leads 
    WHERE school IS NOT NULL 
      AND school != ''
      AND assigned_to = p_user_id;
  END IF;

  -- Get unique districts (with role-based filtering)
  IF v_user_role = 'admin' THEN
    SELECT jsonb_agg(DISTINCT district ORDER BY district) INTO v_districts
    FROM public.leads 
    WHERE district IS NOT NULL AND district != '';
  ELSE
    SELECT jsonb_agg(DISTINCT district ORDER BY district) INTO v_districts
    FROM public.leads 
    WHERE district IS NOT NULL 
      AND district != ''
      AND assigned_to = p_user_id;
  END IF;

  -- Get unique genders (with role-based filtering)
  IF v_user_role = 'admin' THEN
    SELECT jsonb_agg(DISTINCT gender ORDER BY gender) INTO v_genders
    FROM public.leads 
    WHERE gender IS NOT NULL AND gender != '';
  ELSE
    SELECT jsonb_agg(DISTINCT gender ORDER BY gender) INTO v_genders
    FROM public.leads 
    WHERE gender IS NOT NULL 
      AND gender != ''
      AND assigned_to = p_user_id;
  END IF;

  -- Get unique streams (with role-based filtering)
  IF v_user_role = 'admin' THEN
    SELECT jsonb_agg(DISTINCT stream ORDER BY stream) INTO v_streams
    FROM public.leads 
    WHERE stream IS NOT NULL AND stream != '';
  ELSE
    SELECT jsonb_agg(DISTINCT stream ORDER BY stream) INTO v_streams
    FROM public.leads 
    WHERE stream IS NOT NULL 
      AND stream != ''
      AND assigned_to = p_user_id;
  END IF;

  -- Build result object
  v_result := jsonb_build_object(
    'school', COALESCE(v_schools, '[]'::jsonb),
    'district', COALESCE(v_districts, '[]'::jsonb),
    'gender', COALESCE(v_genders, '[]'::jsonb),
    'stream', COALESCE(v_streams, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_unique_values(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_unique_values(uuid) IS 'Returns unique values for filter dropdowns with role-based filtering. Pass NULL for admin (all data), or user_id for sales rep (only assigned leads).';
