'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FilterSection } from './FilterSection'
import { VirtualizedFilterSection } from './VirtualizedFilterSection'
import { SearchBar } from './SearchBar'
import { CustomFieldFilters } from './CustomFieldFilters'
import { useFilterStore } from '@/stores/filterStore'
import { useLeadCounts } from '@/hooks/useLeadCounts'
import { useFilterValueCounts } from '@/hooks/useFilterValueCounts'
import { useUniqueValues } from '@/hooks/useUniqueValues'
import { Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function FilterPanel() {
  const {
    school,
    district,
    gender,
    stream,
    searchQuery,
    debouncedSchool,
    debouncedDistrict,
    debouncedGender,
    debouncedStream,
    debouncedSearchQuery,
    setSchool,
    setDistrict,
    setGender,
    setStream,
    setSearchQuery,
    clearAllFilters,
    applyDebouncedFilters,
  } = useFilterStore()

  const { data: counts } = useLeadCounts()
  const { data: valueCounts, isLoading: isLoadingCounts } = useFilterValueCounts()
  const { data: allUniqueValues, isLoading: isLoadingUnique } = useUniqueValues()
  
  const isLoadingValues = isLoadingCounts || isLoadingUnique
  
  // Memoize the sorting function to prevent recalculation on every render
  const uniqueValues = useMemo(() => {
    if (!allUniqueValues) return null
    
    const sortByCount = (allValues: string[], counts: Record<string, number>, minCount = 1) => {
      if (!allValues || !Array.isArray(allValues)) return []
      
      // Create array of [value, count] pairs
      const withCounts = allValues.map(value => ({
        value,
        count: counts?.[value] || 0
      }))
      
      // Filter by minimum count, then sort by count (highest first), then alphabetically
      return withCounts
        .filter(item => item.count >= minCount) // Filter by minimum count
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count
          return a.value.localeCompare(b.value)
        })
        .map(item => item.value)
    }
    
    return {
      school: sortByCount(allUniqueValues.school, valueCounts?.school || {}, 20), // Only show schools with 20+ leads
      district: sortByCount(allUniqueValues.district, valueCounts?.district || {}),
      gender: sortByCount(allUniqueValues.gender, valueCounts?.gender || {}),
      stream: sortByCount(allUniqueValues.stream, valueCounts?.stream || {}),
    }
  }, [allUniqueValues, valueCounts])

  const hasActiveFilters =
    school.length > 0 ||
    district.length > 0 ||
    gender.length > 0 ||
    stream.length > 0 ||
    searchQuery.trim() !== ''

  const totalSelectedFilters =
    school.length + district.length + gender.length + stream.length + (searchQuery ? 1 : 0)

  // Check if there are unapplied changes
  const hasUnappliedChanges =
    JSON.stringify(school) !== JSON.stringify(debouncedSchool) ||
    JSON.stringify(district) !== JSON.stringify(debouncedDistrict) ||
    JSON.stringify(gender) !== JSON.stringify(debouncedGender) ||
    JSON.stringify(stream) !== JSON.stringify(debouncedStream) ||
    searchQuery !== debouncedSearchQuery

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {totalSelectedFilters > 0 && (
              <Badge variant="default">{totalSelectedFilters}</Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground mt-2">
          {isLoadingValues ? (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <span>Loading filters...</span>
            </div>
          ) : counts ? (
            counts.hasActiveFilters ? (
              <>
                Showing <strong>{counts.filteredCount}</strong> of{' '}
                <strong>{counts.totalCount}</strong> leads
              </>
            ) : (
              <>
                <strong>{counts.totalCount}</strong> total leads
              </>
            )
          ) : null}
        </div>

        {/* Show loading indicator when filters are being applied */}
        <AnimatePresence>
          {hasUnappliedChanges && (
            <motion.div 
              className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <span>Applying filters...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, phone..."
        />

        <Separator className="my-4" />

        {/* Filter Sections */}
        <div className="space-y-4">
          {/* Virtualized School Filter with Search */}
          <VirtualizedFilterSection
            title="School"
            options={uniqueValues?.school || []}
            selectedValues={school}
            onChange={setSchool}
            isLoading={isLoadingValues}
            counts={valueCounts?.school || {}}
          />

          <Separator />

          <FilterSection
            title="District"
            options={uniqueValues?.district || []}
            selectedValues={district}
            onChange={setDistrict}
            isLoading={isLoadingValues}
            counts={valueCounts?.district || {}}
          />

          <Separator />

          <FilterSection
            title="Gender"
            options={uniqueValues?.gender || []}
            selectedValues={gender}
            onChange={setGender}
            isLoading={isLoadingValues}
            counts={valueCounts?.gender || {}}
          />

          <Separator />

          <FilterSection
            title="Stream"
            options={uniqueValues?.stream || []}
            selectedValues={stream}
            onChange={setStream}
            isLoading={isLoadingValues}
            counts={valueCounts?.stream || {}}
          />

          {/* Custom Field Filters */}
          <CustomFieldFilters />
        </div>
      </CardContent>
    </Card>
  )
}