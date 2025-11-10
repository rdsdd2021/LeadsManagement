-- ============================================================================
-- Add role-based filtering to get_filter_counts function
-- ============================================================================
-- This migration updates the get_filter_counts function to support filtering
-- by assigned_to for non-admin users, enabling proper role-based access control
-- for filter counts without fetching all data client-side.
-- ============================================================================

-- Drop the old function
DROP FUNCTION IF EXISTS public.get_filter_counts(text[], text[], text[], text[], text, timestamptz, timestamptz, jsonb);

-- Create updated function with p_user_id parameter
CREATE OR REPLACE FUNCTION public.get_filter_counts(
  p_school text[] DEFAULT '{}',
  p_district text[] DEFAULT '{}',
  p_gender text[] DEFAULT '{}',
  p_stream text[] DEFAULT '{}',
  p_search_query text DEFAULT '',
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_custom_filters jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL  -- NEW: Filter by assigned_to for non-admin users
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
  v_school_counts jsonb;
  v_district_counts jsonb;
  v_gender_counts jsonb;
  v_stream_counts jsonb;
  v_custom_field_counts jsonb;
BEGIN
  -- School counts
  SELECT jsonb_object_agg(school, count) INTO v_school_counts
  FROM (
    SELECT school, COUNT(*) as count FROM public.leads
    WHERE TRUE
      AND (p_user_id IS NULL OR assigned_to = p_user_id)  -- Role-based filter
      AND (cardinality(p_district) = 0 OR district = ANY(p_district))
      AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
      AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
      AND school IS NOT NULL AND school != ''
    GROUP BY school
  ) t;

  -- District counts
  SELECT jsonb_object_agg(district, count) INTO v_district_counts
  FROM (
    SELECT district, COUNT(*) as count FROM public.leads
    WHERE TRUE
      AND (p_user_id IS NULL OR assigned_to = p_user_id)  -- Role-based filter
      AND (cardinality(p_school) = 0 OR school = ANY(p_school))
      AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
      AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
      AND district IS NOT NULL AND district != ''
    GROUP BY district
  ) t;

  -- Gender counts
  SELECT jsonb_object_agg(gender, count) INTO v_gender_counts
  FROM (
    SELECT gender, COUNT(*) as count FROM public.leads
    WHERE TRUE
      AND (p_user_id IS NULL OR assigned_to = p_user_id)  -- Role-based filter
      AND (cardinality(p_school) = 0 OR school = ANY(p_school))
      AND (cardinality(p_district) = 0 OR district = ANY(p_district))
      AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
      AND gender IS NOT NULL AND gender != ''
    GROUP BY gender
  ) t;

  -- Stream counts
  SELECT jsonb_object_agg(stream, count) INTO v_stream_counts
  FROM (
    SELECT stream, COUNT(*) as count FROM public.leads
    WHERE TRUE
      AND (p_user_id IS NULL OR assigned_to = p_user_id)  -- Role-based filter
      AND (cardinality(p_school) = 0 OR school = ANY(p_school))
      AND (cardinality(p_district) = 0 OR district = ANY(p_district))
      AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
      AND stream IS NOT NULL AND stream != ''
    GROUP BY stream
  ) t;

  -- Custom field counts
  SELECT jsonb_object_agg(field_name, field_counts) INTO v_custom_field_counts
  FROM (
    SELECT key as field_name, jsonb_object_agg(value, count) as field_counts
    FROM (
      SELECT key, value, COUNT(*) as count
      FROM public.leads, LATERAL jsonb_each_text(custom_fields)
      WHERE TRUE
        AND (p_user_id IS NULL OR assigned_to = p_user_id)  -- Role-based filter
        AND (cardinality(p_school) = 0 OR school = ANY(p_school))
        AND (cardinality(p_district) = 0 OR district = ANY(p_district))
        AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
        AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
        AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
        AND (p_date_from IS NULL OR created_at >= p_date_from)
        AND (p_date_to IS NULL OR created_at <= p_date_to)
        AND value IS NOT NULL AND value != ''
      GROUP BY key, value
    ) t
    GROUP BY key
  ) t;

  -- Build result
  v_result := jsonb_build_object(
    'school', COALESCE(v_school_counts, '{}'::jsonb),
    'district', COALESCE(v_district_counts, '{}'::jsonb),
    'gender', COALESCE(v_gender_counts, '{}'::jsonb),
    'stream', COALESCE(v_stream_counts, '{}'::jsonb),
    'customFields', COALESCE(v_custom_field_counts, '{}'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_filter_counts TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_filter_counts IS 'Returns faceted filter counts for leads with role-based filtering support. Pass p_user_id to filter by assigned_to for non-admin users.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The get_filter_counts function now supports role-based filtering:
-- - Pass p_user_id=NULL for admin users (shows all leads)
-- - Pass p_user_id=<user_id> for non-admin users (shows only assigned leads)
-- This enables efficient server-side filtering even with 5k+ leads per user
-- ============================================================================
