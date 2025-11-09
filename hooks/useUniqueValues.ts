'use client'

import { useQuery } from '@tanstack/react-query'
import { useRealtime } from './useRealtime'

interface UniqueValues {
  school: string[]
  district: string[]
  gender: string[]
  stream: string[]
}

export function useUniqueValues() {
  const queryKey = ['unique-values']
  
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🔍 Fetching unique filter values from API...')

      // Use server-side API to fetch ALL unique values (bypasses RLS and 1000 row limit)
      const response = await fetch('/api/unique-values')
      
      if (!response.ok) {
        throw new Error('Failed to fetch unique values')
      }

      const data: UniqueValues = await response.json()
      
      console.log('✅ Unique values loaded:', {
        schools: data.school.length,
        districts: data.district.length,
        genders: data.gender.length,
        streams: data.stream.length,
      })

      return data
    },
    staleTime: 60 * 1000, // Cache for 60 seconds to prevent excessive refetching
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Disable to prevent request cancellations
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
  })

  // Set up realtime subscription to invalidate unique values when leads change
  useRealtime({
    table: 'leads',
    queryKey,
    enabled: true, // Re-enabled after fixing publication settings
  })

  // No polling - updates happen via:
  // 1. Realtime events (instant)
  // 2. Manual invalidation after bulk operations (immediate)
  // 3. Window focus (when returning to tab)
  // This prevents database overload with many concurrent users

  return query
}