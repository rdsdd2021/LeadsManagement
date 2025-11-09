-- Performance Optimization: Add indexes for faster queries
-- This migration adds indexes to improve query performance for large datasets

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_leads_status;
DROP INDEX IF EXISTS idx_leads_category;
DROP INDEX IF EXISTS idx_leads_region;
DROP INDEX IF EXISTS idx_leads_created_at;
DROP INDEX IF EXISTS idx_leads_updated_at;
DROP INDEX IF EXISTS idx_leads_status_category;
DROP INDEX IF EXISTS idx_leads_status_region;
DROP INDEX IF EXISTS idx_leads_assigned_to;
DROP INDEX IF EXISTS idx_leads_search;

-- Single column indexes for common filters
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_category ON public.leads(category);
CREATE INDEX idx_leads_region ON public.leads(region) WHERE region IS NOT NULL;
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_updated_at ON public.leads(updated_at DESC);

-- Composite indexes for common filter combinations
-- These speed up queries that filter by multiple columns
CREATE INDEX idx_leads_status_category ON public.leads(status, category);
CREATE INDEX idx_leads_status_region ON public.leads(status, region) WHERE region IS NOT NULL;
CREATE INDEX idx_leads_category_region ON public.leads(category, region) WHERE region IS NOT NULL;

-- Index for RBAC - assigned leads
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to) WHERE assigned_to IS NOT NULL;

-- Full-text search index for name, email, phone
-- This dramatically speeds up search queries
CREATE INDEX idx_leads_search ON public.leads 
USING gin(to_tsvector('english', 
  name || ' ' || 
  COALESCE(email, '') || ' ' || 
  COALESCE(phone, '')
));

-- Index for value-based queries (high-value leads, etc.)
CREATE INDEX idx_leads_value ON public.leads(value DESC);

-- Index for priority
CREATE INDEX idx_leads_priority ON public.leads(priority DESC) WHERE priority IS NOT NULL;

-- Composite index for common sorting + filtering
CREATE INDEX idx_leads_status_created ON public.leads(status, created_at DESC);

-- Update table statistics for query planner optimization
ANALYZE public.leads;

-- Add comment for documentation
COMMENT ON INDEX idx_leads_status IS 'Speeds up status filter queries';
COMMENT ON INDEX idx_leads_category IS 'Speeds up category filter queries';
COMMENT ON INDEX idx_leads_region IS 'Speeds up region filter queries';
COMMENT ON INDEX idx_leads_search IS 'Full-text search index for name, email, phone';
COMMENT ON INDEX idx_leads_status_category IS 'Composite index for status + category filters';
