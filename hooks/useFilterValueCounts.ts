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

  const queryKey = ['filter-counts', { school, district, gender, stream, searchQuery, dateRange, customFilters }]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🔍 Fetching filter counts from optimized API (with role filtering)...')

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
    staleTime: 30 * 1000, // Cache for 30 seconds to prevent excessive refetching
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Disable to prevent request cancellations
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    enabled: true, // Always enabled
  })

  // Set up realtime subscription to invalidate filter counts when leads change
  useRealtime({
    table: 'leads',
    queryKey: ['filter-counts'], // Use stable key to match manual invalidations
    enabled: true, // Re-enabled after fixing publication settings
  })

  // No polling - updates happen via:
  // 1. Realtime events (instant)
  // 2. Manual invalidation after bulk operations (immediate)
  // 3. Window focus (when returning to tab)
  // This prevents database overload with many concurrent users

  return query
}
