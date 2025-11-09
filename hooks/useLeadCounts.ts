'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useFilterStore } from '@/stores/filterStore'
import { useRealtime } from './useRealtime'

export function useLeadCounts() {
  const {
    debouncedSchool: school,
    debouncedDistrict: district,
    debouncedGender: gender,
    debouncedStream: stream,
    debouncedSearchQuery: searchQuery,
    debouncedDateRange: dateRange,
    debouncedCustomFilters: customFilters,
  } = useFilterStore()

  const queryKey = [
    'lead-counts',
    { school, district, gender, stream, searchQuery, dateRange, customFilters },
  ]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🔍 Fetching lead counts...')

      // Build query for filtered count
      let filteredQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true }) // head: true = don't return data, just count

      // Apply same filters as main query
      if (school.length > 0) {
        filteredQuery = filteredQuery.in('school', school)
      }
      if (district.length > 0) {
        filteredQuery = filteredQuery.in('district', district)
      }
      if (gender.length > 0) {
        filteredQuery = filteredQuery.in('gender', gender)
      }
      if (stream.length > 0) {
        filteredQuery = filteredQuery.in('stream', stream)
      }
      if (searchQuery.trim()) {
        filteredQuery = filteredQuery.or(
          `name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
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
          school.length > 0 ||
          district.length > 0 ||
          gender.length > 0 ||
          stream.length > 0 ||
          searchQuery.trim() !== '' ||
          dateRange.from !== null ||
          dateRange.to !== null ||
          Object.keys(customFilters).length > 0,
      }
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  })

  // Set up realtime subscription to invalidate counts when leads change
  useRealtime({
    table: 'leads',
    queryKey,
    enabled: false, // Disabled until realtime is enabled in Supabase dashboard
  })

  return query
}