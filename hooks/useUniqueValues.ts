'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UniqueValues {
  status: string[]
  category: string[]
  region: string[]
}

export function useUniqueValues() {
  return useQuery({
    queryKey: ['unique-values'],
    queryFn: async () => {
      console.log('🔍 Fetching unique filter values...')

      // Fetch unique statuses
      const { data: statusData } = await supabase
        .from('leads')
        .select('status')
        .order('status')

      // Fetch unique categories
      const { data: categoryData } = await supabase
        .from('leads')
        .select('category')
        .order('category')

      // Fetch unique regions
      const { data: regionData } = await supabase
        .from('leads')
        .select('region')
        .order('region')

      // Extract unique values
      const uniqueStatuses = [
        ...new Set(statusData?.map((row) => row.status).filter(Boolean)),
      ]
      const uniqueCategories = [
        ...new Set(categoryData?.map((row) => row.category).filter(Boolean)),
      ]
      const uniqueRegions = [
        ...new Set(regionData?.map((row) => row.region).filter(Boolean)),
      ]

      console.log('✅ Unique values:', {
        statuses: uniqueStatuses.length,
        categories: uniqueCategories.length,
        regions: uniqueRegions.length,
      })

      return {
        status: uniqueStatuses,
        category: uniqueCategories,
        region: uniqueRegions,
      } as UniqueValues
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}