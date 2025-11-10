import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Per-user cache for unique values
const userCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 5 * 1000 // 5 seconds (faster updates)

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get current user for role-based filtering
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return allCookies
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // Ignore errors from setting cookies in API routes
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔐 Auth check (unique-values):', {
      hasUser: !!user,
      userEmail: user?.email,
      authError: authError?.message,
      cookieCount: allCookies.length
    })
    
    // Require authentication
    if (authError || !user) {
      console.error('❌ Unauthorized access to unique-values API')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: { 'Cache-Control': 'no-cache' }
        }
      )
    }
    
    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const userRole = userData?.role || 'sales_rep'
    const userId = user.id
    const cacheKey = `${userId}-${userRole}`

    // Check per-user cache
    const cached = userCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`⚡ Returning cached unique values for ${userRole}`)
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        }
      })
    }

    console.log(`🔍 Fetching unique values for ${userRole} (${user?.email})...`)

    // Pass user_id for role-based filtering (null for admin = all data)
    const userIdParam = userRole === 'admin' ? null : userId
    
    // Use database function for server-side aggregation (no row limits!)
    const { data, error } = await supabaseServer.rpc('get_unique_values', {
      p_user_id: userIdParam
    })

    if (error) {
      console.error('❌ Error calling get_unique_values:', error)
      throw error
    }

    const result = data
    
    // Update per-user cache
    userCache.set(cacheKey, { data: result, timestamp: Date.now() })
    
    // Clean up old cache entries (keep only last 100 users)
    if (userCache.size > 100) {
      const oldestKey = userCache.keys().next().value
      userCache.delete(oldestKey)
    }

    const duration = Date.now() - startTime
    console.log(`✅ Fetched unique values for ${userRole} in ${duration}ms:`, {
      schools: result.school?.length || 0,
      districts: result.district?.length || 0,
      genders: result.gender?.length || 0,
      streams: result.stream?.length || 0,
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ Error fetching unique values after ${duration}ms:`, error)
    
    return NextResponse.json({
      school: [],
      district: [],
      gender: [],
      stream: [],
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      }
    })
  }
}
