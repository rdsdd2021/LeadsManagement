'use client'

import { Button } from '@/components/ui/button'
import { useFilterStore } from '@/stores/filterStore'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  totalCount: number
  currentPage: number
  pageSize: number
}

export function Pagination({ totalCount, currentPage, pageSize }: PaginationProps) {
  const { setPage, setPageSize } = useFilterStore()

  const totalPages = Math.ceil(totalCount / pageSize)
  const hasNextPage = currentPage < totalPages - 1
  const hasPrevPage = currentPage > 0

  const startItem = currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalCount)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first, last, and pages around current
      pages.push(0) // First page

      if (currentPage > 2) {
        pages.push('...')
      }

      // Pages around current
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 3) {
        pages.push('...')
      }

      pages.push(totalPages - 1) // Last page
    }

    return pages
  }

  if (totalCount === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      {/* Results info */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalCount}</span> results
        </p>

        {/* Page size selector */}
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800"
        >
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
          <option value={200}>200 per page</option>
          <option value={500}>500 per page</option>
        </select>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(0)}
          disabled={!hasPrevPage}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage - 1)}
          disabled={!hasPrevPage}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-2 text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(page as number)}
                  className="h-8 min-w-8 px-2"
                >
                  {(page as number) + 1}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage + 1)}
          disabled={!hasNextPage}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(totalPages - 1)}
          disabled={!hasNextPage}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
