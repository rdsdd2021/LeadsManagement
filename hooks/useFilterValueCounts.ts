'use client'

import { useQuery } from '@tanstack/react-query'
import { useFilterStore } from '@/stores/filterStore'
import { useRealtime } from './useRealtime'

interface FilterValueCounts {
  school: Record<string, number>
  district: Record<string, number>
  gender: Record<string, number>
  stream: Record<string, number>
  customFields: Record<string, Record<string, number>>
}

export function useFilterValueCounts() {
  // Get DEBOUNCED filters from store
  const {
    debouncedSchool: school,
    debouncedDistrict: district,
    debouncedGender: gender,
    debouncedStream: stream,
    debouncedSearchQuery: searchQuery,
    debouncedDateRange: dateRange,
    debouncedCustomFilters: customFilters,
  } = useFilterStore()

  const queryKey = ['filter-value-counts', { school, district, gender, stream, searchQuery, dateRange, customFilters }]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🔍 Fetching filter counts from optimized API...')

      const response = await fetch('/api/filter-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school,
          district,
          gender,
          stream,
          searchQuery,
          dateRange: {
            from: dateRange.from?.toISOString(),
            to: dateRange.to?.toISOString(),
          },
          customFilters,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch filter counts')
      }

      const data: FilterValueCounts = await response.json()
      console.log('✅ Filter counts loaded:', data)

      return data
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (longer since data doesn't change often)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  })

  // Set up realtime subscription to invalidate filter counts when leads change
  useRealtime({
    table: 'leads',
    queryKey,
    enabled: false, // Disabled until realtime is enabled in Supabase dashboard
  })

  return query
}
