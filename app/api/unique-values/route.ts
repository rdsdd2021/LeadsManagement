import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// Cache for unique values (short cache for faster updates)
let cachedValues: any = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 1000 // 5 seconds (faster updates)

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check cache
    if (cachedValues && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      console.log('⚡ Returning cached unique values')
      return NextResponse.json(cachedValues, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        }
      })
    }

    console.log('🔍 Fetching ALL unique values from database (server-side)...')

    // Use database function for server-side aggregation (no row limits!)
    const { data, error } = await supabaseServer.rpc('get_unique_values')

    if (error) {
      console.error('❌ Error calling get_unique_values:', error)
      throw error
    }

    const result = data
    
    // Update cache
    cachedValues = result
    cacheTimestamp = Date.now()

    const duration = Date.now() - startTime
    console.log(`✅ Fetched all unique values in ${duration}ms`)

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
