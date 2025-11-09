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
    school?: string[]
    district?: string[]
    gender?: string[]
    stream?: string[]
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
    let body: AssignmentRequest
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : String(parseError),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { filters, assignments, totalCount, selectedIds } = body

    // Validate required fields
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          details: 'assignments array is required and must not be empty',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (typeof totalCount !== 'number' || totalCount <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          details: 'totalCount must be a positive number',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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
      // Fetch ALL lead IDs in batches (no 10k limit!)
      leadIds = []
      let from = 0
      const pageSize = 1000

      while (leadIds.length < totalCount) {
        // Build query with filters for each batch
        let query = supabaseClient
          .from('leads')
          .select('id')
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters.school && filters.school.length > 0) {
          query = query.in('school', filters.school)
        }
        if (filters.district && filters.district.length > 0) {
          query = query.in('district', filters.district)
        }
        if (filters.gender && filters.gender.length > 0) {
          query = query.in('gender', filters.gender)
        }
        if (filters.stream && filters.stream.length > 0) {
          query = query.in('stream', filters.stream)
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

        // Fetch batch
        const { data, error } = await query.range(from, from + pageSize - 1)

        if (error) throw error
        if (!data || data.length === 0) break

        leadIds.push(...data.map((lead: any) => lead.id))
        console.log(`📦 Fetched ${data.length} IDs (total: ${leadIds.length}/${totalCount})`)

        if (data.length < pageSize) break
        from += pageSize
      }

      // Trim to exact count
      leadIds = leadIds.slice(0, totalCount)
    }

    console.log(`📊 Found ${leadIds.length} leads to assign`)

    // Distribute leads according to assignments
    let currentIndex = 0
    const results = []
    const BATCH_SIZE = 500 // Process in batches to avoid URL length limits

    for (const assignment of assignments) {
      const leadsToAssign = leadIds.slice(currentIndex, currentIndex + assignment.count)

      if (leadsToAssign.length === 0) break

      console.log(`📝 Assigning ${leadsToAssign.length} leads to user ${assignment.userId}`)

      // Bulk update in batches
      const now = new Date().toISOString()
      let totalAssigned = 0

      for (let i = 0; i < leadsToAssign.length; i += BATCH_SIZE) {
        const batch = leadsToAssign.slice(i, i + BATCH_SIZE)
        
        const { error, count } = await supabaseClient
          .from('leads')
          .update({
            assigned_to: assignment.userId,
            assignment_date: now,
            updated_at: now,
          })
          .in('id', batch)

        if (error) {
          console.error(`❌ Failed to assign batch to user ${assignment.userId}:`, JSON.stringify(error, null, 2))
          throw new Error(`Failed to assign leads: ${error.message || JSON.stringify(error)}`)
        }

        totalAssigned += count || batch.length
        console.log(`✅ Assigned batch ${Math.floor(i / BATCH_SIZE) + 1}: ${count || batch.length} leads to user ${assignment.userId}`)
      }

      console.log(`✅ Total assigned ${totalAssigned} leads to user ${assignment.userId}`)

      results.push({
        userId: assignment.userId,
        assigned: totalAssigned,
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
    
    // Provide detailed error information with proper serialization
    let errorMessage = 'Internal server error'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
    } else if (typeof error === 'object' && error !== null) {
      // Handle Supabase error objects
      errorMessage = (error as any).message || JSON.stringify(error)
      errorDetails = JSON.stringify(error, null, 2)
    } else {
      errorDetails = String(error)
    }
    
    console.error('Error message:', errorMessage)
    console.error('Error details:', errorDetails)
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
