'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilterStore } from '@/stores/filterStore'

const USE_EDGE_FUNCTION = true // Toggle to use Edge Function or client-side

export function useBulkDelete() {
  const [loading, setLoading] = useState(false)
  const {
    debouncedSchool: school,
    debouncedDistrict: district,
    debouncedGender: gender,
    debouncedStream: stream,
    debouncedSearchQuery: searchQuery,
    debouncedDateRange: dateRange,
    debouncedCustomFilters: customFilters,
  } = useFilterStore()

  const bulkDeleteViaEdgeFunction = async (
    count: number,
    selectedIds?: string[]
  ): Promise<number> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-delete-leads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            filters: {
              school,
              district,
              gender,
              stream,
              searchQuery,
              dateRange: {
                from: dateRange.from?.toISOString() || null,
                to: dateRange.to?.toISOString() || null,
              },
              customFilters,
            },
            count,
            selectedIds,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Deletion failed')
      }

      const result = await response.json()
      console.log(`✅ Edge function deleted ${result.deleted} leads`)
      return result.deleted
    } catch (err) {
      console.error('Edge function deletion failed:', err)
      throw err
    }
  }

  const bulkDeleteClientSide = async (leadIds: string[]): Promise<number> => {
    try {
      if (leadIds.length === 0) {
        throw new Error('No leads to delete')
      }

      // For large batches, use edge function to avoid URL length limits
      if (leadIds.length > 100) {
        console.log(`Using edge function for ${leadIds.length} leads (too many for client-side)`)
        return await bulkDeleteViaEdgeFunction(leadIds.length, leadIds)
      }

      // Delete leads in smaller batches
      const BATCH_SIZE = 50
      let totalDeleted = 0

      for (let i = 0; i < leadIds.length; i += BATCH_SIZE) {
        const batch = leadIds.slice(i, i + BATCH_SIZE)
        
        const { error, count } = await supabase
          .from('leads')
          .delete({ count: 'exact' })
          .in('id', batch)

        if (error) {
          console.error('Failed to delete batch:', error)
          throw error
        }

        totalDeleted += count || batch.length
        console.log(`Deleted batch ${i / BATCH_SIZE + 1}: ${count || batch.length} leads`)
      }

      console.log(`✅ Successfully deleted ${totalDeleted} leads`)
      return totalDeleted
    } catch (err) {
      console.error('Bulk delete failed:', err)
      throw err
    }
  }

  const bulkDelete = async (
    countOrIds: number | string[],
    selectedIds?: string[]
  ): Promise<number> => {
    setLoading(true)
    try {
      if (USE_EDGE_FUNCTION && typeof countOrIds === 'number') {
        // Use edge function with count
        return await bulkDeleteViaEdgeFunction(countOrIds, selectedIds)
      } else if (Array.isArray(countOrIds)) {
        // Use client-side with IDs
        return await bulkDeleteClientSide(countOrIds)
      } else {
        throw new Error('Invalid parameters')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    bulkDelete,
    loading,
  }
}
