-- ============================================================================
-- COMPLETE SCHEMA MIGRATION - Lead Management System
-- This is a consolidated migration that creates the complete schema
-- Run this for fresh project setup
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'sales_rep', 'viewer')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- User policies (non-recursive to avoid infinite loops)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
CREATE POLICY "Service role can manage all users"
  ON public.users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth users
INSERT INTO public.users (id, email, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'role', 'viewer')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. LEAD BUCKETS & CUSTOM FIELDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id UUID REFERENCES public.lead_buckets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'textarea', 'email', 'phone', 'url')),
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  placeholder TEXT,
  help_text TEXT,
  validation_rules JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bucket_id, name)
);

ALTER TABLE public.lead_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- Bucket policies
DROP POLICY IF EXISTS "Everyone can view active buckets" ON public.lead_buckets;
CREATE POLICY "Everyone can view active buckets"
  ON public.lead_buckets FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage buckets" ON public.lead_buckets;
CREATE POLICY "Admins can manage buckets"
  ON public.lead_buckets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Custom field policies
DROP POLICY IF EXISTS "Everyone can view custom fields" ON public.custom_fields;
CREATE POLICY "Everyone can view custom fields"
  ON public.custom_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_buckets
      WHERE id = custom_fields.bucket_id AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage custom fields" ON public.custom_fields;
CREATE POLICY "Admins can manage custom fields"
  ON public.custom_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create default bucket
INSERT INTO public.lead_buckets (name, description, icon, color) VALUES
  ('Seminar', 'Seminar leads and registrations', 'Calendar', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. LEADS TABLE (CLEAN SCHEMA - NO GENDER CONSTRAINT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  -- System fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bucket_id UUID REFERENCES public.lead_buckets(id) ON DELETE SET NULL,
  
  -- User-uploaded mandatory fields (from CSV)
  name TEXT NOT NULL,
  phone TEXT,
  school TEXT,
  district TEXT,
  gender TEXT, -- No constraint for flexibility
  stream TEXT,
  
  -- User-uploaded custom fields (JSONB)
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Assignment fields (system-managed)
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignment_date DATE
);

-- Remove gender constraint if it exists (for migrations)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_gender_check;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Lead policies
DROP POLICY IF EXISTS "Users can view their assigned leads" ON public.leads;
CREATE POLICY "Users can view their assigned leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR assigned_to IS NULL
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update their assigned leads" ON public.leads;
CREATE POLICY "Users can update their assigned leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;
CREATE POLICY "Admins can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 4. IMPORT JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id UUID REFERENCES public.lead_buckets(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'completed', 'failed')),
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own import jobs" ON public.import_jobs;
CREATE POLICY "Users can view own import jobs"
  ON public.import_jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own import jobs" ON public.import_jobs;
CREATE POLICY "Users can create own import jobs"
  ON public.import_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all import jobs" ON public.import_jobs;
CREATE POLICY "Admins can view all import jobs"
  ON public.import_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_school ON public.leads(school);
CREATE INDEX IF NOT EXISTS idx_leads_district ON public.leads(district);
CREATE INDEX IF NOT EXISTS idx_leads_gender ON public.leads(gender);
CREATE INDEX IF NOT EXISTS idx_leads_stream ON public.leads(stream);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_bucket_id ON public.leads(bucket_id);
CREATE INDEX IF NOT EXISTS idx_leads_assignment_date ON public.leads(assignment_date);
CREATE INDEX IF NOT EXISTS idx_leads_custom_fields ON public.leads USING gin(custom_fields);
CREATE INDEX IF NOT EXISTS idx_leads_name ON public.leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);

-- Import jobs indexes
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON public.import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON public.import_jobs(created_at DESC);

-- Bucket indexes
CREATE INDEX IF NOT EXISTS idx_lead_buckets_active ON public.lead_buckets(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_fields_bucket_id ON public.custom_fields(bucket_id);

-- ============================================================================
-- 6. STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('csv-imports', 'csv-imports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload own CSV files" ON storage.objects;
CREATE POLICY "Users can upload own CSV files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'csv-imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can read own CSV files" ON storage.objects;
CREATE POLICY "Users can read own CSV files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'csv-imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own CSV files" ON storage.objects;
CREATE POLICY "Users can delete own CSV files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'csv-imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Service role can manage all CSV files" ON storage.objects;
CREATE POLICY "Service role can manage all CSV files"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'csv-imports');

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get custom field unique values
CREATE OR REPLACE FUNCTION get_custom_field_unique_values(field_name TEXT)
RETURNS TABLE(value TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    (custom_fields->>field_name)::TEXT as value
  FROM leads
  WHERE custom_fields ? field_name
    AND custom_fields->>field_name IS NOT NULL
    AND custom_fields->>field_name != ''
  ORDER BY value
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_custom_field_unique_values(TEXT) TO authenticated;

-- Function for bulk assignment
CREATE OR REPLACE FUNCTION bulk_assign_leads(
  lead_ids TEXT[],
  user_id TEXT
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can bulk assign leads';
  END IF;

  UPDATE leads
  SET 
    assigned_to = user_id::UUID,
    assignment_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id::TEXT = ANY(lead_ids);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION bulk_assign_leads(TEXT[], TEXT) TO authenticated;

-- Function to get filter counts with faceted search support (OPTIMIZED)
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

  -- Get custom field counts (simplified)
  v_custom_field_counts := '{}'::jsonb;

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_filter_counts(TEXT[], TEXT[], TEXT[], TEXT[], TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_filter_counts(TEXT[], TEXT[], TEXT[], TEXT[], TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB) TO service_role;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buckets_updated_at ON public.lead_buckets;
CREATE TRIGGER update_buckets_updated_at
  BEFORE UPDATE ON public.lead_buckets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. REALTIME CONFIGURATION
-- ============================================================================

-- Enable replica identity for realtime updates
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- Check if the publication exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add the leads table to the realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Table already in publication
  END;
END $$;

-- Grant SELECT permission for realtime
GRANT SELECT ON public.leads TO authenticated;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'User accounts with role-based access control';
COMMENT ON TABLE public.leads IS 'Lead records with mandatory fields, custom fields, and realtime updates';
COMMENT ON TABLE public.lead_buckets IS 'Lead templates/buckets with custom field schemas';
COMMENT ON TABLE public.custom_fields IS 'Custom field definitions for each bucket';
COMMENT ON TABLE public.import_jobs IS 'Tracks CSV import jobs with progress and status';

COMMENT ON COLUMN public.leads.name IS 'Lead name - mandatory field';
COMMENT ON COLUMN public.leads.phone IS 'Phone number - optional field';
COMMENT ON COLUMN public.leads.school IS 'School name - optional field';
COMMENT ON COLUMN public.leads.district IS 'District - optional field';
COMMENT ON COLUMN public.leads.gender IS 'Gender - optional field (no constraints)';
COMMENT ON COLUMN public.leads.stream IS 'Stream/Course - optional field';
COMMENT ON COLUMN public.leads.custom_fields IS 'Bucket-specific custom fields (JSONB)';
COMMENT ON COLUMN public.leads.assigned_to IS 'User assigned to this lead';
COMMENT ON COLUMN public.leads.assignment_date IS 'Date when lead was assigned';

COMMENT ON FUNCTION get_filter_counts IS 'Returns faceted filter counts for leads with database-level aggregation';

-- ============================================================================
-- COMPLETE! Ready for production use
-- ============================================================================
