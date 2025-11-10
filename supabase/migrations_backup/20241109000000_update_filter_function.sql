-- Update filter counts function with timeout
CREATE OR REPLACE FUNCTION get_filter_counts(
  p_school TEXT[] DEFAULT '{}',
  p_district TEXT[] DEFAULT '{}',
  p_gender TEXT[] DEFAULT '{}',
  p_stream TEXT[] DEFAULT '{}',
  p_search_query TEXT DEFAULT '',
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_custom_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_school_counts JSONB;
  v_district_counts JSONB;
  v_gender_counts JSONB;
  v_stream_counts JSONB;
  v_custom_field_counts JSONB;
  v_base_where TEXT;
BEGIN
  -- Set statement timeout to 10 seconds to prevent long-running queries
  SET LOCAL statement_timeout = '10s';
  
  -- Build base WHERE clause (used for all queries)
  v_base_where := 'WHERE 1=1';
  
  -- Add search filter
  IF p_search_query IS NOT NULL AND p_search_query != '' THEN
    v_base_where := v_base_where || format(' AND (name ILIKE %L OR phone ILIKE %L)', 
      '%' || p_search_query || '%', '%' || p_search_query || '%');
  END IF;
  
  -- Add date range filters
  IF p_date_from IS NOT NULL THEN
    v_base_where := v_base_where || format(' AND created_at >= %L', p_date_from);
  END IF;
  
  IF p_date_to IS NOT NULL THEN
    v_base_where := v_base_where || format(' AND created_at <= %L', p_date_to);
  END IF;
  
  -- Add custom field filters
  IF p_custom_filters IS NOT NULL AND jsonb_typeof(p_custom_filters) = 'object' THEN
    DECLARE
      v_key TEXT;
      v_value TEXT;
    BEGIN
      FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_custom_filters)
      LOOP
        IF v_value IS NOT NULL AND v_value != '' THEN
          v_base_where := v_base_where || format(' AND custom_fields->>%L = %L', v_key, v_value);
        END IF;
      END LOOP;
    END;
  END IF;

  -- Get school counts (exclude school filter)
  EXECUTE format('
    SELECT jsonb_object_agg(school, count)
    FROM (
      SELECT school, COUNT(*)::int as count
      FROM leads
      %s
      %s
      %s
      %s
      AND school IS NOT NULL AND school != ''''
      GROUP BY school
      ORDER BY count DESC
    ) t',
    v_base_where,
    CASE WHEN array_length(p_district, 1) > 0 THEN format('AND district = ANY(%L)', p_district) ELSE '' END,
    CASE WHEN array_length(p_gender, 1) > 0 THEN format('AND gender = ANY(%L)', p_gender) ELSE '' END,
    CASE WHEN array_length(p_stream, 1) > 0 THEN format('AND stream = ANY(%L)', p_stream) ELSE '' END
  ) INTO v_school_counts;

  -- Get district counts (exclude district filter)
  EXECUTE format('
    SELECT jsonb_object_agg(district, count)
    FROM (
      SELECT district, COUNT(*)::int as count
      FROM leads
      %s
      %s
      %s
      %s
      AND district IS NOT NULL AND district != ''''
      GROUP BY district
      ORDER BY count DESC
    ) t',
    v_base_where,
    CASE WHEN array_length(p_school, 1) > 0 THEN format('AND school = ANY(%L)', p_school) ELSE '' END,
    CASE WHEN array_length(p_gender, 1) > 0 THEN format('AND gender = ANY(%L)', p_gender) ELSE '' END,
    CASE WHEN array_length(p_stream, 1) > 0 THEN format('AND stream = ANY(%L)', p_stream) ELSE '' END
  ) INTO v_district_counts;

  -- Get gender counts (exclude gender filter)
  EXECUTE format('
    SELECT jsonb_object_agg(gender, count)
    FROM (
      SELECT gender, COUNT(*)::int as count
      FROM leads
      %s
      %s
      %s
      %s
      AND gender IS NOT NULL AND gender != ''''
      GROUP BY gender
      ORDER BY count DESC
    ) t',
    v_base_where,
    CASE WHEN array_length(p_school, 1) > 0 THEN format('AND school = ANY(%L)', p_school) ELSE '' END,
    CASE WHEN array_length(p_district, 1) > 0 THEN format('AND district = ANY(%L)', p_district) ELSE '' END,
    CASE WHEN array_length(p_stream, 1) > 0 THEN format('AND stream = ANY(%L)', p_stream) ELSE '' END
  ) INTO v_gender_counts;

  -- Get stream counts (exclude stream filter)
  EXECUTE format('
    SELECT jsonb_object_agg(stream, count)
    FROM (
      SELECT stream, COUNT(*)::int as count
      FROM leads
      %s
      %s
      %s
      %s
      AND stream IS NOT NULL AND stream != ''''
      GROUP BY stream
      ORDER BY count DESC
    ) t',
    v_base_where,
    CASE WHEN array_length(p_school, 1) > 0 THEN format('AND school = ANY(%L)', p_school) ELSE '' END,
    CASE WHEN array_length(p_district, 1) > 0 THEN format('AND district = ANY(%L)', p_district) ELSE '' END,
    CASE WHEN array_length(p_gender, 1) > 0 THEN format('AND gender = ANY(%L)', p_gender) ELSE '' END
  ) INTO v_stream_counts;

  -- Get custom field counts
  EXECUTE format('
    SELECT jsonb_object_agg(field_name, field_counts)
    FROM (
      SELECT 
        key as field_name,
        jsonb_object_agg(value, count) as field_counts
      FROM (
        SELECT 
          key,
          value,
          COUNT(*)::int as count
        FROM leads,
        LATERAL jsonb_each_text(custom_fields)
        %s
        %s
        %s
        %s
        %s
        AND value IS NOT NULL AND value != ''''
        GROUP BY key, value
      ) t
      GROUP BY key
    ) t',
    v_base_where,
    CASE WHEN array_length(p_school, 1) > 0 THEN format('AND school = ANY(%L)', p_school) ELSE '' END,
    CASE WHEN array_length(p_district, 1) > 0 THEN format('AND district = ANY(%L)', p_district) ELSE '' END,
    CASE WHEN array_length(p_gender, 1) > 0 THEN format('AND gender = ANY(%L)', p_gender) ELSE '' END,
    CASE WHEN array_length(p_stream, 1) > 0 THEN format('AND stream = ANY(%L)', p_stream) ELSE '' END
  ) INTO v_custom_field_counts;

  -- Build result
  v_result := jsonb_build_object(
    'school', COALESCE(v_school_counts, '{}'::jsonb),
    'district', COALESCE(v_district_counts, '{}'::jsonb),
    'gender', COALESCE(v_gender_counts, '{}'::jsonb),
    'stream', COALESCE(v_stream_counts, '{}'::jsonb),
    'customFields', v_custom_field_counts
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
