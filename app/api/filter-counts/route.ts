import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// In-memory cache for deduplication (simple implementation)
const requestCache = new Map<string, { promise: Promise<any>, timestamp: number }>()
const CACHE_TTL = 1000 // 1 second (faster updates)

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
      bustCache = false, // Force cache refresh
    } = body

    console.log('🔍 Filter counts API called', bustCache ? '(cache busted)' : '')

    // Create cache key from request parameters
    const cacheKey = JSON.stringify({ school, district, gender, stream, searchQuery, dateRange, customFilters })
    
    // Clear cache if requested
    if (bustCache) {
      requestCache.delete(cacheKey)
      console.log('🗑️ Cache cleared for this request')
    }
    
    // Check if there's an ongoing request for the same parameters
    const cached = requestCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('⚡ Returning cached/ongoing request')
      const result = await cached.promise
      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        }
      })
    }

    // Create the promise for this request
    const requestPromise = (async () => {
      // Use database function for server-side aggregation (no row limits!)
      const { data, error } = await supabaseServer.rpc('get_filter_counts', {
        p_school: school,
        p_district: district,
        p_gender: gender,
        p_stream: stream,
        p_search_query: searchQuery || '',
        p_date_from: dateRange?.from || null,
        p_date_to: dateRange?.to || null,
        p_custom_filters: customFilters || {}
      })

      if (error) {
        console.error('❌ Error calling get_filter_counts:', error)
        throw error
      }

      const duration = Date.now() - startTime
      
      // Check if all counts are empty (no data in database)
      const isEmpty = Object.keys(data.school || {}).length === 0 &&
                     Object.keys(data.district || {}).length === 0 &&
                     Object.keys(data.gender || {}).length === 0 &&
                     Object.keys(data.stream || {}).length === 0 &&
                     Object.keys(data.customFields || {}).length === 0
      
      if (isEmpty) {
        console.log(`✅ Filter counts computed in ${duration}ms (server-side): ALL EMPTY - clearing cache`)
        // Clear cache immediately for empty results
        requestCache.delete(cacheKey)
      } else {
        console.log(`✅ Filter counts computed in ${duration}ms (server-side):`, {
          schoolCount: Object.keys(data.school || {}).length,
          districtCount: Object.keys(data.district || {}).length,
          genderCount: Object.keys(data.gender || {}).length,
          streamCount: Object.keys(data.stream || {}).length,
          customFieldsCount: Object.keys(data.customFields || {}).length,
        })
      }

      return data
    })()

    // Store in cache
    requestCache.set(cacheKey, { promise: requestPromise, timestamp: Date.now() })
    
    // Clean up old cache entries
    setTimeout(() => {
      requestCache.delete(cacheKey)
    }, CACHE_TTL)

    const result = await requestPromise

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ Error fetching filter counts after ${duration}ms:`, error)
    
    return NextResponse.json({
      school: {},
      district: {},
      gender: {},
      stream: {},
      customFields: {},
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      }
    })
  }
}
