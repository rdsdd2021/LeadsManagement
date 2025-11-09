'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilterStore } from '@/stores/filterStore'

interface UserAssignment {
  userId: string
  count: number
}

const USE_EDGE_FUNCTION = true // Toggle to use Edge Function or client-side

export function useBulkAssign() {
  const [loading, setLoading] = useState(false)
  const {
    status,
    category,
    region,
    searchQuery,
    dateRange,
    customFilters,
  } = useFilterStore()

  const getFilteredLeadIds = async (limit: number): Promise<string[]> => {
    try {
      // Build the same query as useLeads but only get IDs
      // IMPORTANT: No pagination limit here - we want ALL filtered leads
      let query = supabase
        .from('leads')
        .select('id')
        .order('created_at', { ascending: false })

      // Apply filters
      if (status.length > 0) {
        query = query.in('status', status)
      }
      if (category.length > 0) {
        query = query.in('category', category)
      }
      if (region.length > 0) {
        query = query.in('region', region)
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

      // Limit to requested count (but fetch from ALL filtered results)
      query = query.limit(Math.min(limit, 10000)) // Safety limit of 10k

      const { data, error } = await query

      if (error) throw error

      console.log(`✅ Fetched ${data?.length} lead IDs for bulk operation`)
      return data?.map((lead) => lead.id) || []
    } catch (err) {
      console.error('Failed to get filtered lead IDs:', err)
      throw err
    }
  }

  const bulkAssignViaEdgeFunction = async (
    assignments: UserAssignment[],
    totalCount: number,
    selectedIds?: string[]
  ): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-assign-leads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            filters: {
              status,
              category,
              region,
              searchQuery,
              dateRange,
              customFilters,
            },
            assignments,
            totalCount,
            selectedIds,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Assignment failed')
      }

      const result = await response.json()
      console.log(`✅ Edge function assigned ${result.totalAssigned} leads`)
    } catch (err) {
      console.error('Edge function assignment failed:', err)
      throw err
    }
  }

  const bulkAssignClientSide = async (
    assignments: UserAssignment[],
    totalCount: number,
    selectedIds?: string[]
  ): Promise<void> => {
    try {
      // Get lead IDs to assign
      let leadIds: string[]
      
      if (selectedIds && selectedIds.length > 0) {
        // Use pre-selected IDs
        leadIds = selectedIds
      } else {
        // Get IDs from filtered results
        leadIds = await getFilteredLeadIds(totalCount)
      }

      if (leadIds.length === 0) {
        throw new Error('No leads to assign')
      }

      // Distribute leads according to assignments
      let currentIndex = 0
      
      for (const assignment of assignments) {
        const leadsToAssign = leadIds.slice(currentIndex, currentIndex + assignment.count)
        
        if (leadsToAssign.length === 0) break

        // Bulk update using Supabase
        const { error } = await supabase
          .from('leads')
          .update({ 
            assigned_to: assignment.userId,
            updated_at: new Date().toISOString()
          })
          .in('id', leadsToAssign)

        if (error) {
          console.error(`Failed to assign leads to user ${assignment.userId}:`, error)
          throw error
        }

        currentIndex += assignment.count
      }

      console.log(`✅ Successfully assigned ${currentIndex} leads`)
    } catch (err) {
      console.error('Bulk assign failed:', err)
      throw err
    }
  }

  const bulkAssign = async (
    assignments: UserAssignment[],
    totalCount: number,
    selectedIds?: string[]
  ): Promise<void> => {
    setLoading(true)
    try {
      if (USE_EDGE_FUNCTION) {
        await bulkAssignViaEdgeFunction(assignments, totalCount, selectedIds)
      } else {
        await bulkAssignClientSide(assignments, totalCount, selectedIds)
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    bulkAssign,
    loading,
  }
}
