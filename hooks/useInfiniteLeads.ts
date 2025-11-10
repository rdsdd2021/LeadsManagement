'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useFilterStore } from '@/stores/filterStore'
import { useMemo } from 'react'

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

export function useInfiniteLeads() {
  const {
    debouncedSchool: school,
    debouncedDistrict: district,
    debouncedGender: gender,
    debouncedStream: stream,
    debouncedSearchQuery: searchQuery,
    debouncedDateRange: dateRange,
    debouncedCustomFilters: customFilters,
    pageSize,
  } = useFilterStore()

  const queryKey = [
    'leads-infinite',
    {
      school,
      district,
      gender,
      stream,
      searchQuery,
      dateRange,
      customFilters,
      pageSize,
    },
  ]

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      console.log('🔍 Fetching leads page:', pageParam)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Start building the query with user join
      let supabaseQuery = supabase
        .from('leads')
        .select(`
          *,
          assigned_user:users!assigned_to(id, email, name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Check if user is admin
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        // Non-admins see only their assigned leads
        if (userData?.role !== 'admin') {
          supabaseQuery = supabaseQuery.eq('assigned_to', user.id)
        }
      }

      // Apply filters
      if (school.length > 0) {
        supabaseQuery = supabaseQuery.in('school', school)
      }
      if (district.length > 0) {
        supabaseQuery = supabaseQuery.in('district', district)
      }
      if (gender.length > 0) {
        supabaseQuery = supabaseQuery.in('gender', gender)
      }
      if (stream.length > 0) {
        supabaseQuery = supabaseQuery.in('stream', stream)
      }
      if (searchQuery.trim()) {
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        )
      }
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
      const start = pageParam * pageSize
      const end = start + pageSize - 1
      supabaseQuery = supabaseQuery.range(start, end)

      // Execute query
      const { data, error, count } = await supabaseQuery

      if (error) {
        console.error('❌ Error fetching leads:', error)
        throw error
      }

      console.log('✅ Fetched leads:', data?.length, 'of', count)

      return {
        data: data as Lead[],
        count: count || 0,
        nextPage: data && data.length === pageSize ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 30 * 1000,
  })

  // Flatten all pages into a single array
  const allLeads = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data) || []
  }, [query.data])

  const totalCount = query.data?.pages[0]?.count || 0

  return {
    ...query,
    allLeads,
    totalCount,
  }
}
