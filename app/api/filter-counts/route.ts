import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// In-memory cache for deduplication (simple implementation)
const requestCache = new Map<string, { promise: Promise<any>, timestamp: number }>()
const CACHE_TTL = 5000 // 5 seconds

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
    } = body

    console.log('🔍 Filter counts API called')

    // Create cache key from request parameters
    const cacheKey = JSON.stringify({ school, district, gender, stream, searchQuery, dateRange, customFilters })
    
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
      // Optimized: Fetch data for each field separately with filters
    const fetchFieldCounts = async (field: string, excludeField: string) => {
      let query = supabaseServer.from('leads').select(field)

      // Apply filters except the excluded field
      if (excludeField !== 'school' && school.length > 0) {
        query = query.in('school', school)
      }
      if (excludeField !== 'district' && district.length > 0) {
        query = query.in('district', district)
      }
      if (excludeField !== 'gender' && gender.length > 0) {
        query = query.in('gender', gender)
      }
      if (excludeField !== 'stream' && stream.length > 0) {
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

      // Optimized: Fetch in larger chunks and use Map for faster lookups
      const counts = new Map<string, number>()
      let from = 0
      const pageSize = 2000 // Increased from 1000 for fewer round trips
      let hasMore = true
      const maxIterations = 50 // Safety limit to prevent infinite loops

      let iterations = 0
      while (hasMore && iterations < maxIterations) {
        const { data, error } = await query.range(from, from + pageSize - 1)
        
        if (error) {
          console.error(`❌ Error fetching ${field}:`, error)
          break
        }
        
        if (data && data.length > 0) {
          console.log(`📦 Fetched ${data.length} rows for ${field} (iteration ${iterations + 1}, total unique: ${counts.size})`)
          
          // Optimized: Batch process for better performance
          for (const row of data) {
            const value = row[field]
            if (value && String(value).trim() !== '') {
              counts.set(value, (counts.get(value) || 0) + 1)
            }
          }
          
          from += pageSize
          hasMore = data.length === pageSize
          iterations++
        } else {
          hasMore = false
        }
      }

      console.log(`✅ ${field}: Found ${counts.size} unique values after ${iterations} iterations`)
      
      // Convert Map to object
      return Object.fromEntries(counts)
    }

    // Fetch custom field counts
    const fetchCustomFieldCounts = async () => {
      const customFieldCounts: Record<string, Record<string, number>> = {}
      
      // Fetch all leads with custom fields
      let query = supabaseServer.from('leads').select('custom_fields')
      
      // Apply all filters
      if (school.length > 0) query = query.in('school', school)
      if (district.length > 0) query = query.in('district', district)
      if (gender.length > 0) query = query.in('gender', gender)
      if (stream.length > 0) query = query.in('stream', stream)
      if (searchQuery && searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      }
      if (dateRange?.from) query = query.gte('created_at', dateRange.from)
      if (dateRange?.to) query = query.lte('created_at', dateRange.to)
      
      // Fetch in chunks
      let from = 0
      const pageSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const { data, error } = await query.range(from, from + pageSize - 1)
        
        if (error) break
        
        if (data && data.length > 0) {
          data.forEach((row: any) => {
            if (row.custom_fields && typeof row.custom_fields === 'object') {
              Object.entries(row.custom_fields).forEach(([key, value]) => {
                if (value && String(value).trim() !== '') {
                  if (!customFieldCounts[key]) {
                    customFieldCounts[key] = {}
                  }
                  const strValue = String(value)
                  customFieldCounts[key][strValue] = (customFieldCounts[key][strValue] || 0) + 1
                }
              })
            }
          })
          
          from += pageSize
          hasMore = data.length === pageSize
        } else {
          hasMore = false
        }
      }
      
      return customFieldCounts
    }

    // Fetch all field counts in parallel
    const [schoolCounts, districtCounts, genderCounts, streamCounts, customFieldCounts] = await Promise.all([
      fetchFieldCounts('school', 'school'),
      fetchFieldCounts('district', 'district'),
      fetchFieldCounts('gender', 'gender'),
      fetchFieldCounts('stream', 'stream'),
      fetchCustomFieldCounts(),
    ])

      const duration = Date.now() - startTime
      console.log(`✅ Filter counts computed in ${duration}ms:`, {
        schoolCount: Object.keys(schoolCounts).length,
        districtCount: Object.keys(districtCounts).length,
        genderCount: Object.keys(genderCounts).length,
        streamCount: Object.keys(streamCounts).length,
        customFieldsCount: Object.keys(customFieldCounts).length,
      })

      return {
        school: schoolCounts,
        district: districtCounts,
        gender: genderCounts,
        stream: streamCounts,
        customFields: customFieldCounts,
      }
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
