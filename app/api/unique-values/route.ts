import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// Cache for unique values (they don't change often)
let cachedValues: any = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

    console.log('🔍 Fetching ALL unique values from database...')

    // Fetch ALL unique values for each field
    const fetchAllUniqueValues = async (field: string) => {
      const uniqueValues = new Set<string>()
      let from = 0
      const pageSize = 2000
      let hasMore = true
      let iterations = 0
      const maxIterations = 100 // Allow up to 200k rows

      while (hasMore && iterations < maxIterations) {
        const { data, error } = await supabaseServer
          .from('leads')
          .select(field)
          .range(from, from + pageSize - 1)
        
        if (error) {
          console.error(`❌ Error fetching ${field}:`, error)
          break
        }
        
        if (!data || data.length === 0) {
          break
        }
        
        data.forEach((row: any) => {
          const value = row[field]
          if (value && String(value).trim() !== '') {
            uniqueValues.add(value)
          }
        })
        
        from += pageSize
        hasMore = data.length === pageSize
        iterations++
      }
      
      const result = Array.from(uniqueValues).sort()
      console.log(`✅ ${field}: Found ${result.length} unique values (${iterations} iterations, ${from} rows scanned)`)
      
      return result
    }

    // Fetch all fields in parallel
    const [school, district, gender, stream] = await Promise.all([
      fetchAllUniqueValues('school'),
      fetchAllUniqueValues('district'),
      fetchAllUniqueValues('gender'),
      fetchAllUniqueValues('stream'),
    ])

    const result = { school, district, gender, stream }
    
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
