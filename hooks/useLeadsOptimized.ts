'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRealtime } from './useRealtime'
import { useFilterStore } from '@/stores/filterStore'

interface Lead {
  id: string
  status: string
  category: string
  region: string | null
  name: string
  phone: string | null
  email: string | null
  value: number
  priority: number
  assigned_to: string | null
  custom_fields: any
  created_at: string
  updated_at: string
  created_by: string | null
  team: string | null
}

interface UseLeadsOptions {
  // Performance options
  selectColumns?: string  // Specify which columns to fetch
  useEstimatedCount?: boolean  // Use estimated count for faster queries
  enableRealtime?: boolean  // Enable/disable realtime updates
  cacheTime?: number  // How long to cache results (ms)
}

export function useLeadsOptimized(options: UseLeadsOptions = {}) {
  const {
    selectColumns = '*',
    useEstimatedCount = false,
    enableRealtime = true,
    cacheTime = 30 * 1000,  // 30 seconds default
  } = options

  // Get filters from Zustand store
  const {
    status,
    category,
    region,
    searchQuery,
    dateRange,
    customFilters,
    page,
    pageSize,
  } = useFilterStore()

  const queryKey = [
    'leads',
    {
      status,
      category,
      region,
      searchQuery,
      dateRange,
      customFilters,
      page,
      pageSize,
      selectColumns,
    },
  ]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🔍 Fetching leads with filters:', {
        status,
        category,
        region,
        searchQuery,
        page,
        pageSize,
      })

      const startTime = performance.now()

      // Start building the query with specified columns
      let supabaseQuery = supabase
        .from('leads')
        .select(selectColumns, { 
          count: useEstimatedCount ? 'estimated' : 'exact' 
        })
        .order('created_at', { ascending: false })

      // Apply status filter
      if (status.length > 0) {
        supabaseQuery = supabaseQuery.in('status', status)
      }

      // Apply category filter
      if (category.length > 0) {
        supabaseQuery = supabaseQuery.in('category', category)
      }

      // Apply region filter
      if (region.length > 0) {
        supabaseQuery = supabaseQuery.in('region', region)
      }

      // Apply search query using full-text search for better performance
      if (searchQuery.trim()) {
        // Use full-text search if available, otherwise fallback to ILIKE
        const searchTerm = searchQuery.trim()
        
        // Try full-text search first (requires idx_leads_search index)
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        )
      }

      // Apply date range filter
      if (dateRange.from) {
        supabaseQuery = supabaseQuery.gte('created_at', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        supabaseQuery = supabaseQuery.lte('created_at', dateRange.to.toISOString())
      }

      // Apply custom field filters
      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          supabaseQuery = supabaseQuery.eq(`custom_fields->>${key}`, value)
        }
      })

      // Apply pagination
      const start = page * pageSize
      const end = start + pageSize - 1
      supabaseQuery = supabaseQuery.range(start, end)

      // Execute query
      const { data, error, count } = await supabaseQuery

      const endTime = performance.now()
      const queryTime = Math.round(endTime - startTime)

      if (error) {
        console.error('❌ Error fetching leads:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length} leads of ${count} in ${queryTime}ms`)

      // Performance warning
      if (queryTime > 1000) {
        console.warn('⚠️ Slow query detected:', queryTime, 'ms')
      }

      return {
        data: data as Lead[],
        count: count || 0,
        queryTime,
      }
    },
    staleTime: cacheTime,
    gcTime: 5 * 60 * 1000,  // Keep in cache for 5 minutes
  })

  // Set up realtime subscription
  useRealtime({
    table: 'leads',
    queryKey,
    enabled: enableRealtime,
  })

  return query
}

// Preset configurations for different use cases

// For dashboard overview (fast, minimal data)
export function useLeadsDashboard() {
  return useLeadsOptimized({
    selectColumns: 'id, name, status, category, value, created_at',
    useEstimatedCount: true,
    cacheTime: 60 * 1000,  // 1 minute cache
  })
}

// For detailed view (all data, accurate count)
export function useLeadsDetailed() {
  return useLeadsOptimized({
    selectColumns: '*',
    useEstimatedCount: false,
    cacheTime: 30 * 1000,  // 30 seconds cache
  })
}

// For export/reporting (no realtime, longer cache)
export function useLeadsExport() {
  return useLeadsOptimized({
    selectColumns: '*',
    useEstimatedCount: false,
    enableRealtime: false,
    cacheTime: 5 * 60 * 1000,  // 5 minutes cache
  })
}
