import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// In-memory cache for deduplication
const requestCache = new Map<string, { promise: Promise<any>, timestamp: number }>()
const CACHE_TTL = 3000 // 3 seconds for leads (shorter than filter counts)

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

    // Execute query directly (cache disabled for now to ensure role-based filtering works correctly)
    const result = await (async () => {
      // Create user-scoped Supabase client (respects RLS policies)
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            },
          },
        }
      )

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ Error getting user:', userError)
      }
      
      console.log('👤 Current user:', user?.id, user?.email)
      
      // Start building the query with user join (using user-scoped client)
      let query = supabase
        .from('leads')
        .select(`
          *,
          assigned_user:users!assigned_to(id, email, name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Check if user is admin - non-admins see only their assigned leads
      if (user) {
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (roleError) {
          console.error('❌ Error getting user role:', roleError)
        }

        console.log('👤 User role:', userData?.role)

        if (userData?.role !== 'admin') {
          console.log('🔒 Non-admin user - filtering by assigned_to:', user.id)
          query = query.eq('assigned_to', user.id)
        } else {
          console.log('👑 Admin user - showing all leads')
        }
      } else {
        console.log('⚠️ No user found in session')
      }

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

      return {
        data: data || [],
        count: count || 0,
      }
    })()

    return NextResponse.json(result)
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
