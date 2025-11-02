'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useFilterStore } from '@/stores/filterStore'

export function useLeadCounts() {
  const {
    status,
    category,
    region,
    searchQuery,
    dateRange,
    customFilters,
  } = useFilterStore()

  return useQuery({
    queryKey: [
      'lead-counts',
      { status, category, region, searchQuery, dateRange, customFilters },
    ],
    queryFn: async () => {
      console.log('🔍 Fetching lead counts...')

      // Build query for filtered count
      let filteredQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true }) // head: true = don't return data, just count

      // Apply same filters as main query
      if (status.length > 0) {
        filteredQuery = filteredQuery.in('status', status)
      }
      if (category.length > 0) {
        filteredQuery = filteredQuery.in('category', category)
      }
      if (region.length > 0) {
        filteredQuery = filteredQuery.in('region', region)
      }
      if (searchQuery.trim()) {
        filteredQuery = filteredQuery.or(
          `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        )
      }
      if (dateRange.from) {
        filteredQuery = filteredQuery.gte('created_at', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        filteredQuery = filteredQuery.lte('created_at', dateRange.to.toISOString())
      }

      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filteredQuery = filteredQuery.eq(`custom_fields->>${key}`, value)
        }
      })

      // Execute queries
      const [filteredResult, totalResult] = await Promise.all([
        filteredQuery,
        supabase.from('leads').select('*', { count: 'exact', head: true }),
      ])

      const filteredCount = filteredResult.count || 0
      const totalCount = totalResult.count || 0

      console.log('✅ Counts:', { filtered: filteredCount, total: totalCount })

      return {
        filteredCount,
        totalCount,
        hasActiveFilters:
          status.length > 0 ||
          category.length > 0 ||
          region.length > 0 ||
          searchQuery.trim() !== '' ||
          dateRange.from !== null ||
          dateRange.to !== null ||
          Object.keys(customFilters).length > 0,
      }
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  })
}