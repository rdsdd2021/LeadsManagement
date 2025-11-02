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

export function useLeads() {
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
      })

      // Start building the query
      let supabaseQuery = supabase
        .from('leads')
        .select('*', { count: 'exact' })
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

      // Apply search query (searches name, email, phone)
      if (searchQuery.trim()) {
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
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

      if (error) {
        console.error('❌ Error fetching leads:', error)
        throw error
      }

      console.log('✅ Fetched leads:', data?.length, 'of', count)

      return {
        data: data as Lead[],
        count: count || 0,
      }
    },
    staleTime: 30 * 1000,
  })

  // Set up realtime subscription
  useRealtime({
    table: 'leads',
    queryKey,
    enabled: true,
  })

  return query
}