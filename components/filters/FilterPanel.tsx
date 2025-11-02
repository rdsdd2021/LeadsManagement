'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FilterSection } from './FilterSection'
import { SearchBar } from './SearchBar'
import { useFilterStore } from '@/stores/filterStore'
import { useUniqueValues } from '@/hooks/useUniqueValues'
import { useLeadCounts } from '@/hooks/useLeadCounts'
import { Filter, X } from 'lucide-react'

export function FilterPanel() {
  const {
    status,
    category,
    region,
    searchQuery,
    setStatus,
    setCategory,
    setRegion,
    setSearchQuery,
    clearAllFilters,
  } = useFilterStore()

  const { data: uniqueValues, isLoading: isLoadingValues } = useUniqueValues()
  const { data: counts } = useLeadCounts()

  const hasActiveFilters =
    status.length > 0 ||
    category.length > 0 ||
    region.length > 0 ||
    searchQuery.trim() !== ''

  const totalSelectedFilters =
    status.length + category.length + region.length + (searchQuery ? 1 : 0)

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

        {counts && (
          <div className="text-sm text-muted-foreground mt-2">
            {counts.hasActiveFilters ? (
              <>
                Showing <strong>{counts.filteredCount}</strong> of{' '}
                <strong>{counts.totalCount}</strong> leads
              </>
            ) : (
              <>
                <strong>{counts.totalCount}</strong> total leads
              </>
            )}
          </div>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, phone..."
        />

        <Separator className="my-4" />

        {/* Filter Sections */}
        <div className="space-y-4">
          <FilterSection
            title="Status"
            options={uniqueValues?.status || []}
            selectedValues={status}
            onChange={setStatus}
            isLoading={isLoadingValues}
          />

          <Separator />

          <FilterSection
            title="Category"
            options={uniqueValues?.category || []}
            selectedValues={category}
            onChange={setCategory}
            isLoading={isLoadingValues}
          />

          <Separator />

          <FilterSection
            title="Region"
            options={uniqueValues?.region || []}
            selectedValues={region}
            onChange={setRegion}
            isLoading={isLoadingValues}
          />
        </div>
      </CardContent>
    </Card>
  )
}