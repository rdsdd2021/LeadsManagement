'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UniqueValues {
  school: string[]
  district: string[]
  gender: string[]
  stream: string[]
}

export function useUniqueValues() {
  return useQuery({
    queryKey: ['unique-values'],
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}