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
    debouncedSchool: school,
    debouncedDistrict: district,
    debouncedGender: gender,
    debouncedStream: stream,
    debouncedSearchQuery: searchQuery,
    debouncedDateRange: dateRange,
    debouncedCustomFilters: customFilters,
  } = useFilterStore()

  const getFilteredLeadIds = async (limit: number): Promise<string[]> => {
    try {
      console.log(`🔍 Fetching ${limit} lead IDs with filters...`)
      
      const allIds: string[] = []
      let from = 0
      const pageSize = 1000
      
      while (allIds.length < limit) {
        // Build query for each batch
        let query = supabase
          .from('leads')
          .select('id')
          .order('created_at', { ascending: false })

        // Apply filters
        if (school.length > 0) query = query.in('school', school)
        if (district.length > 0) query = query.in('district', district)
        if (gender.length > 0) query = query.in('gender', gender)
        if (stream.length > 0) query = query.in('stream', stream)
        
        if (searchQuery.trim()) {
          query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
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

        // Fetch batch
        const { data, error } = await query.range(from, from + pageSize - 1)

        if (error) throw error
        if (!data || data.length === 0) break

        allIds.push(...data.map(lead => lead.id))
        console.log(`📦 Fetched ${data.length} IDs (total: ${allIds.length}/${limit})`)
        
        if (data.length < pageSize) break // No more data
        from += pageSize
      }

      const finalIds = allIds.slice(0, limit)
      console.log(`✅ Fetched ${finalIds.length} lead IDs for bulk operation`)
      return finalIds
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

      const payload = {
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
        assignments,
        totalCount,
        selectedIds,
      }

      console.log('📤 Sending bulk assign request:', {
        assignmentsCount: assignments.length,
        totalCount,
        hasSelectedIds: !!selectedIds,
        payload: JSON.stringify(payload).substring(0, 200) + '...',
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-assign-leads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Edge function error response:', error)
        throw new Error(error.details || error.error || 'Assignment failed')
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
        const now = new Date().toISOString()
        const { error } = await supabase
          .from('leads')
          .update({ 
            assigned_to: assignment.userId,
            assignment_date: now,
            updated_at: now
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
