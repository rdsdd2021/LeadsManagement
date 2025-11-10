'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-browser'
import { useRealtime } from './useRealtime'
import { useFilterStore } from '@/stores/filterStore'

// Create supabase client instance
const supabase = createClient()

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
    name: string | null
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
    paginationMode,
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
      console.log('🔍 Fetching leads (standard mode) with filters:', {
        school: school.length,
        district: district.length,
        gender: gender.length,
        stream: stream.length,
        searchQuery,
        page,
        showOnlyAssigned,
      })

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        // Start building the query with user join
        let query = supabase
          .from('leads')
          .select(`
            *,
            assigned_user:users!assigned_to(id, email, name)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })

        // Check if user is admin - non-admins see only their assigned leads
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

          // Non-admins see only their assigned leads
          if (userData?.role !== 'admin') {
            query = query.eq('assigned_to', user.id)
          }
        }

        // Apply filters
        if (school.length > 0) {
          query = query.in('school', school)
        }
        if (district.length > 0) {
          query = query.in('district', district)
        }
        if (gender.length > 0) {
          query = query.in('gender', gender)
        }
        if (stream.length > 0) {
          query = query.in('stream', stream)
        }
        if (searchQuery.trim()) {
          query = query.or(
            `name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
          )
        }
        if (dateRange.from) {
          query = query.gte('created_at', dateRange.from.toISOString())
        }
        if (dateRange.to) {
          query = query.lte('created_at', dateRange.to.toISOString())
        }

        // Apply custom field filters
        Object.entries(customFilters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            query = query.eq(`custom_fields->>${key}`, value)
          }
        })

        // Apply pagination
        const start = page * pageSize
        const end = start + pageSize - 1
        query = query.range(start, end)

        // Execute query
        const { data, error, count } = await query

        if (error) {
          console.error('❌ Error fetching leads:', error)
          throw error
        }

        const duration = Date.now() - startTime
        console.log(`✅ Fetched leads in ${duration}ms:`, data?.length, 'of', count)

        return {
          data: data as Lead[],
          count: count || 0,
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
    enabled: paginationMode === 'standard', // Only run when in standard mode
  })

  // Set up realtime subscription
  useRealtime({
    table: 'leads',
    queryKey,
    enabled: true,
  })

  return query
}