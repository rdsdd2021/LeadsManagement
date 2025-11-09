-- Run this SQL in your Supabase SQL Editor to create server-side functions
-- These functions run entirely on the database server with no row limits

-- Function to get filter counts for all fields
CREATE OR REPLACE FUNCTION get_filter_counts(
  p_school text[] DEFAULT '{}',
  p_district text[] DEFAULT '{}',
  p_gender text[] DEFAULT '{}',
  p_stream text[] DEFAULT '{}',
  p_search_query text DEFAULT '',
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_custom_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_school_counts jsonb;
  v_district_counts jsonb;
  v_gender_counts jsonb;
  v_stream_counts jsonb;
  v_custom_field_counts jsonb;
  v_where_clause text;
BEGIN
  -- Build WHERE clause
  v_where_clause := 'TRUE';
  
  -- Apply filters (excluding the field being counted)
  IF array_length(p_school, 1) > 0 THEN
    v_where_clause := v_where_clause || ' AND school = ANY($1)';
  END IF;
  
  IF array_length(p_district, 1) > 0 THEN
    v_where_clause := v_where_clause || ' AND district = ANY($2)';
  END IF;
  
  IF array_length(p_gender, 1) > 0 THEN
    v_where_clause := v_where_clause || ' AND gender = ANY($3)';
  END IF;
  
  IF array_length(p_stream, 1) > 0 THEN
    v_where_clause := v_where_clause || ' AND stream = ANY($4)';
  END IF;
  
  IF p_search_query != '' THEN
    v_where_clause := v_where_clause || ' AND (name ILIKE ''%' || p_search_query || '%'' OR phone ILIKE ''%' || p_search_query || '%'')';
  END IF;
  
  IF p_date_from IS NOT NULL THEN
    v_where_clause := v_where_clause || ' AND created_at >= ''' || p_date_from || '''';
  END IF;
  
  IF p_date_to IS NOT NULL THEN
    v_where_clause := v_where_clause || ' AND created_at <= ''' || p_date_to || '''';
  END IF;

  -- Get school counts (exclude school filter)
  SELECT jsonb_object_agg(school, count)
  INTO v_school_counts
  FROM (
    SELECT school, COUNT(*) as count
    FROM leads
    WHERE TRUE
      AND (cardinality(p_district) = 0 OR district = ANY(p_district))
      AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
      AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
      AND school IS NOT NULL
      AND school != ''
    GROUP BY school
  ) t;

  -- Get district counts (exclude district filter)
  SELECT jsonb_object_agg(district, count)
  INTO v_district_counts
  FROM (
    SELECT district, COUNT(*) as count
    FROM leads
    WHERE TRUE
      AND (cardinality(p_school) = 0 OR school = ANY(p_school))
      AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
      AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
      AND district IS NOT NULL
      AND district != ''
    GROUP BY district
  ) t;

  -- Get gender counts (exclude gender filter)
  SELECT jsonb_object_agg(gender, count)
  INTO v_gender_counts
  FROM (
    SELECT gender, COUNT(*) as count
    FROM leads
    WHERE TRUE
      AND (cardinality(p_school) = 0 OR school = ANY(p_school))
      AND (cardinality(p_district) = 0 OR district = ANY(p_district))
      AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
      AND gender IS NOT NULL
      AND gender != ''
    GROUP BY gender
  ) t;

  -- Get stream counts (exclude stream filter)
  SELECT jsonb_object_agg(stream, count)
  INTO v_stream_counts
  FROM (
    SELECT stream, COUNT(*) as count
    FROM leads
    WHERE TRUE
      AND (cardinality(p_school) = 0 OR school = ANY(p_school))
      AND (cardinality(p_district) = 0 OR district = ANY(p_district))
      AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
      AND stream IS NOT NULL
      AND stream != ''
    GROUP BY stream
  ) t;

  -- Get custom field counts
  SELECT jsonb_object_agg(field_name, field_counts)
  INTO v_custom_field_counts
  FROM (
    SELECT 
      key as field_name,
      jsonb_object_agg(value, count) as field_counts
    FROM (
      SELECT 
        key,
        value,
        COUNT(*) as count
      FROM leads,
      LATERAL jsonb_each_text(custom_fields)
      WHERE TRUE
        AND (cardinality(p_school) = 0 OR school = ANY(p_school))
        AND (cardinality(p_district) = 0 OR district = ANY(p_district))
        AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
        AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
        AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
        AND (p_date_from IS NULL OR created_at >= p_date_from)
        AND (p_date_to IS NULL OR created_at <= p_date_to)
        AND value IS NOT NULL
        AND value != ''
      GROUP BY key, value
    ) t
    GROUP BY key
  ) t;

  -- Combine all results
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

-- Function to get unique values for all fields
CREATE OR REPLACE FUNCTION get_unique_values()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_schools jsonb;
  v_districts jsonb;
  v_genders jsonb;
  v_streams jsonb;
BEGIN
  -- Get unique schools
  SELECT jsonb_agg(DISTINCT school ORDER BY school)
  INTO v_schools
  FROM leads
  WHERE school IS NOT NULL AND school != '';

  -- Get unique districts
  SELECT jsonb_agg(DISTINCT district ORDER BY district)
  INTO v_districts
  FROM leads
  WHERE district IS NOT NULL AND district != '';

  -- Get unique genders
  SELECT jsonb_agg(DISTINCT gender ORDER BY gender)
  INTO v_genders
  FROM leads
  WHERE gender IS NOT NULL AND gender != '';

  -- Get unique streams
  SELECT jsonb_agg(DISTINCT stream ORDER BY stream)
  INTO v_streams
  FROM leads
  WHERE stream IS NOT NULL AND stream != '';

  -- Combine results
  v_result := jsonb_build_object(
    'school', COALESCE(v_schools, '[]'::jsonb),
    'district', COALESCE(v_districts, '[]'::jsonb),
    'gender', COALESCE(v_genders, '[]'::jsonb),
    'stream', COALESCE(v_streams, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;
