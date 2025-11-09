// Supabase Edge Function for Bulk Lead Assignment
// This runs on the server for better performance and scalability

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssignmentRequest {
  filters: {
    status?: string[]
    category?: string[]
    region?: string[]
    searchQuery?: string
    dateRange?: {
      from?: string
      to?: string
    }
    customFilters?: Record<string, any>
  }
  assignments: Array<{
    userId: string
    count: number
  }>
  totalCount: number
  selectedIds?: string[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is admin
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: userData } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const body: AssignmentRequest = await req.json()
    const { filters, assignments, totalCount, selectedIds } = body

    console.log('🔄 Starting bulk assignment:', {
      totalCount,
      assignments: assignments.length,
      hasSelectedIds: !!selectedIds,
    })

    // Get lead IDs to assign
    let leadIds: string[]

    if (selectedIds && selectedIds.length > 0) {
      // Use pre-selected IDs
      leadIds = selectedIds
    } else {
      // Build query with filters
      let query = supabaseClient
        .from('leads')
        .select('id')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }
      if (filters.region && filters.region.length > 0) {
        query = query.in('region', filters.region)
      }
      if (filters.searchQuery?.trim()) {
        query = query.or(
          `name.ilike.%${filters.searchQuery}%,phone.ilike.%${filters.searchQuery}%`
        )
      }
      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from)
      }
      if (filters.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to)
      }

      // Apply custom field filters
      if (filters.customFilters) {
        Object.entries(filters.customFilters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            query = query.eq(`custom_fields->>${key}`, value)
          }
        })
      }

      // Limit to requested count
      query = query.limit(Math.min(totalCount, 10000))

      const { data, error } = await query

      if (error) throw error

      leadIds = data?.map((lead: any) => lead.id) || []
    }

    console.log(`📊 Found ${leadIds.length} leads to assign`)

    // Distribute leads according to assignments
    let currentIndex = 0
    const results = []

    for (const assignment of assignments) {
      const leadsToAssign = leadIds.slice(currentIndex, currentIndex + assignment.count)

      if (leadsToAssign.length === 0) break

      // Bulk update
      const { error, count } = await supabaseClient
        .from('leads')
        .update({
          assigned_to: assignment.userId,
          updated_at: new Date().toISOString(),
        })
        .in('id', leadsToAssign)

      if (error) {
        console.error(`❌ Failed to assign to user ${assignment.userId}:`, error)
        throw error
      }

      results.push({
        userId: assignment.userId,
        assigned: leadsToAssign.length,
      })

      currentIndex += assignment.count
    }

    console.log(`✅ Successfully assigned ${currentIndex} leads`)

    return new Response(
      JSON.stringify({
        success: true,
        totalAssigned: currentIndex,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Bulk assignment error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
