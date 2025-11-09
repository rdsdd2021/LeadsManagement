-- Add custom fields support to the optimized filter counts function

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
BEGIN
  -- Use a single CTE to filter the base dataset once
  WITH filtered_base AS (
    SELECT school, district, gender, stream, custom_fields
    FROM leads
    WHERE TRUE
      AND (p_search_query = '' OR name ILIKE '%' || p_search_query || '%' OR phone ILIKE '%' || p_search_query || '%')
      AND (p_date_from IS NULL OR created_at >= p_date_from)
      AND (p_date_to IS NULL OR created_at <= p_date_to)
  )
  -- Get all counts in parallel using the same filtered base
  SELECT 
    jsonb_build_object(
      'school', (
        SELECT jsonb_object_agg(school, count)
        FROM (
          SELECT school, COUNT(*) as count
          FROM filtered_base
          WHERE TRUE
            AND (cardinality(p_district) = 0 OR district = ANY(p_district))
            AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
            AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
            AND school IS NOT NULL
            AND school != ''
          GROUP BY school
          HAVING COUNT(*) >= 20  -- Only show schools with 20+ leads
        ) t
      ),
      'district', (
        SELECT jsonb_object_agg(district, count)
        FROM (
          SELECT district, COUNT(*) as count
          FROM filtered_base
          WHERE TRUE
            AND (cardinality(p_school) = 0 OR school = ANY(p_school))
            AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
            AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
            AND district IS NOT NULL
            AND district != ''
          GROUP BY district
        ) t
      ),
      'gender', (
        SELECT jsonb_object_agg(gender, count)
        FROM (
          SELECT gender, COUNT(*) as count
          FROM filtered_base
          WHERE TRUE
            AND (cardinality(p_school) = 0 OR school = ANY(p_school))
            AND (cardinality(p_district) = 0 OR district = ANY(p_district))
            AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
            AND gender IS NOT NULL
            AND gender != ''
          GROUP BY gender
        ) t
      ),
      'stream', (
        SELECT jsonb_object_agg(stream, count)
        FROM (
          SELECT stream, COUNT(*) as count
          FROM filtered_base
          WHERE TRUE
            AND (cardinality(p_school) = 0 OR school = ANY(p_school))
            AND (cardinality(p_district) = 0 OR district = ANY(p_district))
            AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
            AND stream IS NOT NULL
            AND stream != ''
          GROUP BY stream
        ) t
      ),
      'customFields', (
        SELECT COALESCE(
          jsonb_object_agg(key, field_counts),
          '{}'::jsonb
        )
        FROM (
          SELECT 
            key,
            jsonb_object_agg(value, count) as field_counts
          FROM (
            SELECT 
              key,
              value,
              COUNT(*) as count
            FROM filtered_base,
            LATERAL jsonb_each_text(custom_fields)
            WHERE TRUE
              AND (cardinality(p_school) = 0 OR school = ANY(p_school))
              AND (cardinality(p_district) = 0 OR district = ANY(p_district))
              AND (cardinality(p_gender) = 0 OR gender = ANY(p_gender))
              AND (cardinality(p_stream) = 0 OR stream = ANY(p_stream))
              AND value IS NOT NULL
              AND value != ''
            GROUP BY key, value
          ) t
          GROUP BY key
        ) custom_agg
      )
    )
  INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_filter_counts IS 'Optimized filter counts with custom fields support';
