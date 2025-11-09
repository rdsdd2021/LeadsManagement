'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UniqueValues {
  school: string[]
  district: string[]
  gender: string[]
  stream: string[]
}

export function useUniqueValues() {
  return useQuery({
    queryKey: ['unique-values'],
    queryFn: async () => {
      console.log('🔍 Fetching unique filter values...')

      // Fetch unique values for all filterable fields
      const { data: schoolData } = await supabase
        .from('leads')
        .select('school')
        .order('school')

      const { data: districtData } = await supabase
        .from('leads')
        .select('district')
        .order('district')

      const { data: genderData } = await supabase
        .from('leads')
        .select('gender')
        .order('gender')

      const { data: streamData } = await supabase
        .from('leads')
        .select('stream')
        .order('stream')

      // Extract unique values and filter out null/undefined/empty strings
      const uniqueSchools = [
        ...new Set(
          schoolData
            ?.map((row) => row.school)
            .filter((val) => val !== null && val !== undefined && val !== '')
        ),
      ]
      const uniqueDistricts = [
        ...new Set(
          districtData
            ?.map((row) => row.district)
            .filter((val) => val !== null && val !== undefined && val !== '')
        ),
      ]
      const uniqueGenders = [
        ...new Set(
          genderData
            ?.map((row) => row.gender)
            .filter((val) => val !== null && val !== undefined && val !== '')
        ),
      ]
      const uniqueStreams = [
        ...new Set(
          streamData
            ?.map((row) => row.stream)
            .filter((val) => val !== null && val !== undefined && val !== '')
        ),
      ]

      console.log('✅ Unique values:', {
        schools: uniqueSchools.length,
        districts: uniqueDistricts.length,
        genders: uniqueGenders.length,
        streams: uniqueStreams.length,
      })

      return {
        school: uniqueSchools,
        district: uniqueDistricts,
        gender: uniqueGenders,
        stream: uniqueStreams,
      } as UniqueValues
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}