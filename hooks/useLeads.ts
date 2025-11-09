'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRealtime } from './useRealtime'
import { useFilterStore } from '@/stores/filterStore'

interface Lead {
  // System fields
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  bucket_id: string | null
  
  // User-uploaded mandatory fields (from CSV)
  name: string
  phone: string | null
  school: string | null
  district: string | null
  gender: string | null
  stream: string | null
  
  // User-uploaded custom fields (from CSV, bucket-specific)
  custom_fields: any
  
  // Assignment fields (set by admin/manager)
  assigned_to: string | null
  assignment_date: string | null
  assigned_user?: {
    id: string
    email: string
    full_name: string | null
  } | null
}

export function useLeads(showOnlyAssigned: boolean = false) {
  // Get DEBOUNCED filters from Zustand store (for API calls)
  const {
    debouncedSchool: school,
    debouncedDistrict: district,
    debouncedGender: gender,
    debouncedStream: stream,
    debouncedSearchQuery: searchQuery,
    debouncedDateRange: dateRange,
    debouncedCustomFilters: customFilters,
    page,
    pageSize,
  } = useFilterStore()

  const queryKey = [
    'leads',
    {
      school,
      district,
      gender,
      stream,
      searchQuery,
      dateRange,
      customFilters,
      page,
      pageSize,
      showOnlyAssigned,
    },
  ]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const startTime = Date.now()
      console.log('🔍 Fetching leads via API with filters:', {
        school: school.length,
        district: district.length,
        gender: gender.length,
        stream: stream.length,
        searchQuery,
        page,
        showOnlyAssigned,
      })

      try {
        // Use server-side API for better performance and reliability
        const response = await fetch('/api/leads', {
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
            page,
            pageSize,
            showOnlyAssigned,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || 'Failed to fetch leads')
        }

        const result = await response.json()
        
        const duration = Date.now() - startTime
        console.log(`✅ Fetched leads in ${duration}ms:`, result.data?.length, 'of', result.count)

        return {
          data: result.data as Lead[],
          count: result.count || 0,
        }
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(`❌ Error fetching leads after ${duration}ms:`, error)
        throw error
      }
    },
    staleTime: 30 * 1000,
    retry: 2, // Retry failed queries twice
    retryDelay: 1000, // Wait 1 second between retries
  })

  // Set up realtime subscription
  useRealtime({
    table: 'leads',
    queryKey,
    enabled: true,
  })

  return query
}