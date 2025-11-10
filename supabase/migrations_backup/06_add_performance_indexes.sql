-- Add indexes to dramatically improve filter count performance
-- These indexes will make the get_filter_counts function 10-100x faster

-- Enable pg_trgm extension for faster ILIKE searches (must be first)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for school filtering and counting
CREATE INDEX IF NOT EXISTS idx_leads_school ON public.leads(school) WHERE school IS NOT NULL AND school != '';

-- Index for district filtering and counting
CREATE INDEX IF NOT EXISTS idx_leads_district ON public.leads(district) WHERE district IS NOT NULL AND district != '';

-- Index for gender filtering and counting
CREATE INDEX IF NOT EXISTS idx_leads_gender ON public.leads(gender) WHERE gender IS NOT NULL AND gender != '';

-- Index for stream filtering and counting
CREATE INDEX IF NOT EXISTS idx_leads_stream ON public.leads(stream) WHERE stream IS NOT NULL AND stream != '';

-- Index for date range filtering
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_leads_school_district ON public.leads(school, district) WHERE school IS NOT NULL AND district IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_school_gender ON public.leads(school, gender) WHERE school IS NOT NULL AND gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_school_stream ON public.leads(school, stream) WHERE school IS NOT NULL AND stream IS NOT NULL;

-- Index for text search (name and phone)
CREATE INDEX IF NOT EXISTS idx_leads_name_trgm ON public.leads USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_phone_trgm ON public.leads USING gin(phone gin_trgm_ops);

-- Index for custom fields JSONB queries
CREATE INDEX IF NOT EXISTS idx_leads_custom_fields ON public.leads USING gin(custom_fields);

-- Analyze the table to update statistics for query planner
ANALYZE public.leads;

COMMENT ON INDEX idx_leads_school IS 'Improves school filter and count performance';
COMMENT ON INDEX idx_leads_district IS 'Improves district filter and count performance';
COMMENT ON INDEX idx_leads_gender IS 'Improves gender filter and count performance';
COMMENT ON INDEX idx_leads_stream IS 'Improves stream filter and count performance';
COMMENT ON INDEX idx_leads_created_at IS 'Improves date range filter performance';
COMMENT ON INDEX idx_leads_name_trgm IS 'Improves name search performance with ILIKE';
COMMENT ON INDEX idx_leads_phone_trgm IS 'Improves phone search performance with ILIKE';
