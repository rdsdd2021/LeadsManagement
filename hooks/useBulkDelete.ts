'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useBulkDelete() {
  const [loading, setLoading] = useState(false)

  const bulkDelete = async (leadIds: string[]): Promise<number> => {
    setLoading(true)
    try {
      if (leadIds.length === 0) {
        throw new Error('No leads to delete')
      }

      // Delete leads
      const { error, count } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds)

      if (error) {
        console.error('Failed to delete leads:', error)
        throw error
      }

      console.log(`✅ Successfully deleted ${leadIds.length} leads`)
      return leadIds.length
    } catch (err) {
      console.error('Bulk delete failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    bulkDelete,
    loading,
  }
}
