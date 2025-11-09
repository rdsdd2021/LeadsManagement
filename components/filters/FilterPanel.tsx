'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FilterSection } from './FilterSection'
import { SearchBar } from './SearchBar'
import { CustomFieldFilters } from './CustomFieldFilters'
import { useFilterStore } from '@/stores/filterStore'
import { useLeadCounts } from '@/hooks/useLeadCounts'
import { useFilterValueCounts } from '@/hooks/useFilterValueCounts'
import { useUniqueValues } from '@/hooks/useUniqueValues'
import { Filter, X } from 'lucide-react'

export function FilterPanel() {
  const {
    school,
    district,
    gender,
    stream,
    searchQuery,
    setSchool,
    setDistrict,
    setGender,
    setStream,
    setSearchQuery,
    clearAllFilters,
  } = useFilterStore()

  const { data: counts } = useLeadCounts()
  const { data: valueCounts, isLoading: isLoadingCounts } = useFilterValueCounts()
  const { data: allUniqueValues, isLoading: isLoadingUnique } = useUniqueValues()
  
  const isLoadingValues = isLoadingCounts || isLoadingUnique
  
  // Merge all unique values with counts, sorted by count
  const sortByCount = (allValues: string[], counts: Record<string, number>) => {
    if (!allValues || !Array.isArray(allValues)) return []
    
    // Create array of [value, count] pairs
    const withCounts = allValues.map(value => ({
      value,
      count: counts?.[value] || 0
    }))
    
    // Sort by count (highest first), then alphabetically
    return withCounts
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.value.localeCompare(b.value)
      })
      .map(item => item.value)
  }
  
  const uniqueValues = allUniqueValues ? {
    school: sortByCount(allUniqueValues.school, valueCounts?.school || {}),
    district: sortByCount(allUniqueValues.district, valueCounts?.district || {}),
    gender: sortByCount(allUniqueValues.gender, valueCounts?.gender || {}),
    stream: sortByCount(allUniqueValues.stream, valueCounts?.stream || {}),
  } : null

  const hasActiveFilters =
    school.length > 0 ||
    district.length > 0 ||
    gender.length > 0 ||
    stream.length > 0 ||
    searchQuery.trim() !== ''

  const totalSelectedFilters =
    school.length + district.length + gender.length + stream.length + (searchQuery ? 1 : 0)

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
          <FilterSection
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