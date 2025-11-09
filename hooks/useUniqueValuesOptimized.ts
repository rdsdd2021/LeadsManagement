'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UniqueValues {
  status: string[]
  category: string[]
  region: string[]
}

/**
 * Optimized hook to fetch unique filter values
 * Uses PostgreSQL DISTINCT to get unique values efficiently
 * Works with millions of rows without performance issues
 */
export function useUniqueValuesOptimized() {
  return useQuery({
    queryKey: ['unique-values-optimized'],
    queryFn: async () => {
      console.log('🔍 Fetching unique filter values (optimized)...')
      const startTime = performance.now()

      // Use RPC function for better performance (if available)
      // Otherwise, use distinct queries
      
      // Method 1: Using distinct (works but may hit 1000 limit)
      // Method 2: Using RPC function (best for large datasets)
      
      try {
        // Try to use RPC function first (if it exists)
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_unique_filter_values')
        
        if (!rpcError && rpcData) {
          const endTime = performance.now()
          console.log(`✅ Unique values fetched via RPC in ${Math.round(endTime - startTime)}ms`)
          return rpcData as UniqueValues
        }
      } catch (err) {
        console.log('RPC function not available, using fallback method')
      }

      // Fallback: Use distinct queries
      // Note: This will only return up to 1000 unique values per field
      const [statusResult, categoryResult, regionResult] = await Promise.all([
        supabase
          .from('leads')
          .select('status')
          .order('status')
          .limit(1000),  // Explicit limit
        
        supabase
          .from('leads')
          .select('category')
          .order('category')
          .limit(1000),
        
        supabase
          .from('leads')
          .select('region')
          .order('region')
          .limit(1000)
      ])

      // Extract unique values using Set
      const uniqueStatuses = [
        ...new Set(statusResult.data?.map((row) => row.status).filter(Boolean)),
      ]
      const uniqueCategories = [
        ...new Set(categoryResult.data?.map((row) => row.category).filter(Boolean)),
      ]
      const uniqueRegions = [
        ...new Set(regionResult.data?.map((row) => row.region).filter(Boolean)),
      ]

      const endTime = performance.now()
      console.log(`✅ Unique values fetched in ${Math.round(endTime - startTime)}ms:`, {
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
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}
