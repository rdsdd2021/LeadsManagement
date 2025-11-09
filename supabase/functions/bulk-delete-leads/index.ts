// Supabase Edge Function for Bulk Lead Deletion
// This runs on the server for better performance and scalability

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteRequest {
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
  count: number
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
    const body: DeleteRequest = await req.json()
    const { filters, count, selectedIds } = body

    console.log('🗑️ Starting bulk deletion:', {
      count,
      hasSelectedIds: !!selectedIds,
    })

    // Get lead IDs to delete
    let leadIds: string[]

    if (selectedIds && selectedIds.length > 0) {
      // Use pre-selected IDs
      leadIds = selectedIds
    } else {
      // Fetch ALL lead IDs in batches (no 10k limit!)
      leadIds = []
      let from = 0
      const pageSize = 1000

      while (leadIds.length < count) {
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
        console.log(`📦 Fetched ${data.length} IDs (total: ${leadIds.length}/${count})`)

        if (data.length < pageSize) break
        from += pageSize
      }

      // Trim to exact count
      leadIds = leadIds.slice(0, count)
    }

    console.log(`📊 Found ${leadIds.length} leads to delete`)

    if (leadIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          deleted: 0,
          message: 'No leads to delete',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Delete leads in batches to avoid URL length limits
    const BATCH_SIZE = 500
    let totalDeleted = 0

    for (let i = 0; i < leadIds.length; i += BATCH_SIZE) {
      const batch = leadIds.slice(i, i + BATCH_SIZE)
      
      const { error, count } = await supabaseClient
        .from('leads')
        .delete({ count: 'exact' })
        .in('id', batch)

      if (error) {
        console.error('❌ Failed to delete batch:', error)
        throw error
      }

      totalDeleted += count || batch.length
      console.log(`🗑️ Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${count || batch.length} leads (${totalDeleted}/${leadIds.length})`)
    }

    console.log(`✅ Successfully deleted ${totalDeleted} leads`)

    return new Response(
      JSON.stringify({
        success: true,
        deleted: totalDeleted,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Bulk deletion error:', error)
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
