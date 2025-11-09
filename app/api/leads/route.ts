import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const {
      school = [],
      district = [],
      gender = [],
      stream = [],
      searchQuery = '',
      dateRange = {},
      customFilters = {},
      page = 0,
      pageSize = 100,
      showOnlyAssigned = false,
    } = body

    console.log('🔍 Fetching leads via API:', { 
      school: school.length, 
      district: district.length,
      gender: gender.length,
      stream: stream.length,
      searchQuery,
      page,
      pageSize 
    })

    // Start building the query
    let query = supabaseServer
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (school.length > 0) {
      query = query.in('school', school)
    }
    if (district.length > 0) {
      query = query.in('district', district)
    }
    if (gender.length > 0) {
      query = query.in('gender', gender)
    }
    if (stream.length > 0) {
      query = query.in('stream', stream)
    }

    // Apply search query
    if (searchQuery && searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
    }

    // Apply date range
    if (dateRange?.from) {
      query = query.gte('created_at', dateRange.from)
    }
    if (dateRange?.to) {
      query = query.lte('created_at', dateRange.to)
    }

    // Apply custom field filters
    if (customFilters && Object.keys(customFilters).length > 0) {
      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(`custom_fields->>${key}`, value)
        }
      })
    }

    // Apply pagination
    const start = page * pageSize
    const end = start + pageSize - 1
    query = query.range(start, end)

    // Execute query with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)
    })

    const queryPromise = query

    const { data, error, count } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]) as any

    if (error) {
      console.error('❌ Error fetching leads:', error)
      throw error
    }

    const duration = Date.now() - startTime
    console.log(`✅ Fetched ${data?.length} leads in ${duration}ms (total: ${count})`)

    return NextResponse.json({
      data: data || [],
      count: count || 0,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ Error fetching leads after ${duration}ms:`, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch leads', 
        details: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}
