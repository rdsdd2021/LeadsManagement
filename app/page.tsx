'use client'

import { useLeads } from '@/hooks/useLeads'
import { useInfiniteLeads } from '@/hooks/useInfiniteLeads'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { DataTable } from '@/components/ui/data-table'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Loader2, List, Infinity, MousePointerClick, Filter, X } from 'lucide-react'
import { BulkAssignDialog } from '@/components/leads/BulkAssignDialog'
import { BulkSelectDialog } from '@/components/leads/BulkSelectDialog'
import { BulkActionsMenu } from '@/components/leads/BulkActionsMenu'
import { BulkActionProgress } from '@/components/leads/BulkActionProgress'
import { useBulkAssign } from '@/hooks/useBulkAssign'
import { useBulkDelete } from '@/hooks/useBulkDelete'
import { useQueryClient } from '@tanstack/react-query'
import { Pagination } from '@/components/pagination/Pagination'
import { InfiniteScroll } from '@/components/pagination/InfiniteScroll'
import { useFilterStore } from '@/stores/filterStore'
import { RealtimeStatus } from '@/components/debug/RealtimeStatus'
import { Badge } from '@/components/ui/badge'
import { LeadsTableSkeleton, MobileLeadsTableSkeleton } from '@/components/leads/LeadsTableSkeleton'
import { MobileLeadCard } from '@/components/leads/MobileLeadCard'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { paginationMode, setPaginationMode, page, pageSize, setPage, setPageSize } = useFilterStore()
  
  // Standard pagination
  const { data, isLoading, error, refetch } = useLeads()
  
  // Infinite scroll
  const {
    allLeads,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingInfinite,
    error: errorInfinite,
    refetch: refetchInfinite,
  } = useInfiniteLeads()
  
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showBulkSelect, setShowBulkSelect] = useState(false)
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [bulkSelectedCount, setBulkSelectedCount] = useState(0)
  const [showSlowQueryWarning, setShowSlowQueryWarning] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{
    open: boolean
    action: 'assign' | 'delete'
    total: number
    processed: number
    status: 'processing' | 'success' | 'error'
    error?: string
  }>({
    open: false,
    action: 'delete',
    total: 0,
    processed: 0,
    status: 'processing',
  })
  const { bulkAssign, loading: assignLoading } = useBulkAssign()
  const { bulkDelete, loading: deleteLoading } = useBulkDelete()
  const queryClient = useQueryClient()
  
  // Determine which data to use based on pagination mode
  const leads = paginationMode === 'infinite' ? allLeads : (data?.data || [])
  const count = paginationMode === 'infinite' ? totalCount : (data?.count || 0)
  const isDataLoading = paginationMode === 'infinite' ? isLoadingInfinite : isLoading
  const currentError = paginationMode === 'infinite' ? errorInfinite : error

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return
    
    // Only redirect if definitely not authenticated
    if (!user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Clear selection when data changes (only in standard pagination mode)
  useEffect(() => {
    if (paginationMode === 'standard') {
      setSelectedLeads(new Set())
    }
  }, [data, paginationMode])

  // Show warning if query takes too long
  useEffect(() => {
    if (isDataLoading) {
      const timer = setTimeout(() => {
        setShowSlowQueryWarning(true)
      }, 5000) // Show warning after 5 seconds

      return () => {
        clearTimeout(timer)
        setShowSlowQueryWarning(false)
      }
    } else {
      setShowSlowQueryWarning(false)
    }
  }, [isDataLoading])

  const isAdmin = user?.role === 'admin'



  const handleBulkSelect = (selectedCount: number) => {
    setBulkSelectedCount(selectedCount)
    setShowBulkSelect(false)
    // The actual selection will be handled when performing actions
  }

  const handleBulkAssign = async (assignments: any[]) => {
    try {
      const leadsToAssign = bulkSelectedCount > 0 ? bulkSelectedCount : 
                           selectedLeads.size > 0 ? selectedLeads.size : count

      await bulkAssign(
        assignments,
        leadsToAssign,
        selectedLeads.size > 0 ? Array.from(selectedLeads) : undefined
      )
      
      // Refresh data based on mode
      if (paginationMode === 'infinite') {
        await refetchInfinite()
        queryClient.invalidateQueries({ queryKey: ['leads-infinite'] })
      } else {
        await refetch()
        queryClient.invalidateQueries({ queryKey: ['leads'] })
      }
      
      // Invalidate filter counts to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: ['filter-counts'] })
      
      // Clear selection
      setSelectedLeads(new Set())
      setBulkSelectedCount(0)
      
      alert('Leads assigned successfully!')
    } catch (err: any) {
      console.error('Assignment failed:', err)
      throw err
    }
  }

  const handleBulkDelete = async () => {
    const effectiveCount = bulkSelectedCount > 0 ? bulkSelectedCount : selectedLeads.size
    
    if (effectiveCount === 0) {
      alert('No leads selected for deletion')
      return
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${effectiveCount} lead(s)? This action cannot be undone.`
    )
    
    if (!confirmed) return

    // Show progress dialog
    setBulkProgress({
      open: true,
      action: 'delete',
      total: effectiveCount,
      processed: 0,
      status: 'processing',
    })

    try {
      let deletedCount: number
      
      if (selectedLeads.size > 0) {
        // Use manually selected leads (client-side)
        deletedCount = await bulkDelete(Array.from(selectedLeads))
      } else if (bulkSelectedCount > 0) {
        // Use edge function with count (server-side)
        deletedCount = await bulkDelete(bulkSelectedCount)
      } else {
        return
      }
      
      // Update progress to success
      setBulkProgress(prev => ({
        ...prev,
        processed: deletedCount,
        status: 'success',
      }))

      // Wait a moment to show success
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Refresh data
      if (paginationMode === 'infinite') {
        await refetchInfinite()
        queryClient.invalidateQueries({ queryKey: ['leads-infinite'] })
      } else {
        await refetch()
        queryClient.invalidateQueries({ queryKey: ['leads'] })
      }
      
      // Invalidate filter counts to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: ['filter-counts'] })
      
      // Clear selection
      setSelectedLeads(new Set())
      setBulkSelectedCount(0)
      
      // Close progress dialog
      setBulkProgress(prev => ({ ...prev, open: false }))
    } catch (err: any) {
      console.error('Deletion failed:', err)
      setBulkProgress(prev => ({
        ...prev,
        status: 'error',
        error: err.message || 'Failed to delete leads',
      }))
      
      // Auto-close error after 3 seconds
      setTimeout(() => {
        setBulkProgress(prev => ({ ...prev, open: false }))
      }, 3000)
    }
  }

  const togglePaginationMode = () => {
    const newMode = paginationMode === 'standard' ? 'infinite' : 'standard'
    
    // Clear the cache for the mode we're switching TO
    if (newMode === 'infinite') {
      queryClient.removeQueries({ queryKey: ['leads-infinite'] })
    } else {
      queryClient.removeQueries({ queryKey: ['leads'] })
    }
    
    setPaginationMode(newMode)
    setSelectedLeads(new Set())
    setBulkSelectedCount(0)
  }

  const getTotalSelectedCount = () => {
    if (bulkSelectedCount > 0) return bulkSelectedCount
    if (selectedLeads.size > 0) return selectedLeads.size
    return 0
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="grid grid-cols-12 gap-3 sm:gap-6">
          {/* Desktop Filter Sidebar */}
          {!isMobile && (
            <motion.div 
              className="col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RealtimeStatus />
              <FilterPanel />
            </motion.div>
          )}

          {/* Mobile Filter Sheet */}
          {isMobile && (
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto h-[calc(100vh-80px)] p-4">
                  <RealtimeStatus />
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Data Table */}
          <motion.div 
            className={`col-span-12 ${!isMobile ? 'lg:col-span-9' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="shadow-lg border-0 dark:bg-gray-900/50 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-6">
                {isDataLoading && paginationMode === 'standard' ? (
                  isMobile ? <MobileLeadsTableSkeleton /> : <LeadsTableSkeleton />
                ) : isDataLoading && paginationMode === 'standard' ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading leads...</p>
                    {showSlowQueryWarning && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                        <p className="text-sm text-yellow-800">
                          This is taking longer than usual. Complex filters on large datasets may take time.
                        </p>
                        <p className="text-xs text-yellow-600 mt-2">
                          Try reducing the number of active filters or clearing some selections.
                        </p>
                      </div>
                    )}
                  </div>
                ) : currentError ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">
                      <p className="font-semibold">Error loading leads</p>
                      <p className="text-sm mt-2">{currentError.message}</p>
                    </div>
                    <Button 
                      onClick={() => paginationMode === 'infinite' ? refetchInfinite() : refetch()}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Top Controls */}
                    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        {isMobile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMobileFilters(true)}
                            className="gap-2"
                          >
                            <Filter className="h-4 w-4" />
                            Filters
                          </Button>
                        )}
                        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                          Leads
                        </h2>
                        <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                          {count.toLocaleString()}
                        </Badge>
                        {getTotalSelectedCount() > 0 && (
                          <Badge className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-blue-500 hover:bg-blue-600">
                            {getTotalSelectedCount()} selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Pagination Mode Toggle - Hidden on mobile */}
                        {!isMobile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={togglePaginationMode}
                            className="gap-2"
                          >
                            {paginationMode === 'standard' ? (
                              <>
                                <Infinity className="h-4 w-4" />
                                Infinite Scroll
                              </>
                            ) : (
                              <>
                                <List className="h-4 w-4" />
                                Standard Pages
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Bulk Select Button */}
                        {isAdmin && count > 0 && !isMobile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBulkSelect(true)}
                          >
                            <MousePointerClick className="h-4 w-4 mr-2" />
                            Select Leads
                          </Button>
                        )}
                        
                        {/* Bulk Actions Menu */}
                        {isAdmin && (
                          <BulkActionsMenu
                            selectedCount={getTotalSelectedCount()}
                            onAssign={() => setShowBulkAssign(true)}
                            onDelete={handleBulkDelete}
                            disabled={assignLoading || deleteLoading}
                          />
                        )}
                      </div>
                    </div>

                    {/* Pagination Controls (Top) - Only for standard mode */}
                    {paginationMode === 'standard' && count > 0 && (
                      <div className="mb-4">
                        <Pagination
                          currentPage={page}
                          totalCount={count}
                          pageSize={pageSize}
                          onPageChange={setPage}
                          onPageSizeChange={setPageSize}
                        />
                      </div>
                    )}

                    {/* Table Container */}
                    {isMobile ? (
                      /* Mobile View - Card Layout */
                      <div className="space-y-3">
                        {leads.map((lead: any) => (
                          <MobileLeadCard
                            key={lead.id}
                            lead={lead}
                            selectable={isAdmin}
                            selected={selectedLeads.has(lead.id)}
                            onSelect={(id, checked) => {
                              const newSelection = new Set(selectedLeads)
                              if (checked) {
                                newSelection.add(id)
                              } else {
                                newSelection.delete(id)
                              }
                              setSelectedLeads(newSelection)
                            }}
                          />
                        ))}
                        {paginationMode === 'infinite' && hasNextPage && (
                          <div className="flex justify-center py-4">
                            <Button
                              variant="outline"
                              onClick={() => fetchNextPage()}
                              disabled={isFetchingNextPage}
                            >
                              {isFetchingNextPage ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Loading...
                                </>
                              ) : (
                                'Load More'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : paginationMode === 'infinite' ? (
                      <InfiniteScroll
                        onLoadMore={fetchNextPage}
                        hasMore={hasNextPage || false}
                        loading={isFetchingNextPage}
                      >
                        <DataTable
                          data={leads}
                          keyExtractor={(lead: any) => lead.id}
                          selectable={isAdmin}
                          selectedIds={selectedLeads}
                          onSelectionChange={setSelectedLeads}
                          columns={[
                            {
                              key: 'name',
                              header: 'Name',
                              render: (lead: any) => <span className="font-medium">{lead.name}</span>
                            },
                            {
                              key: 'phone',
                              header: 'Phone Number',
                              render: (lead: any) => lead.phone || '-'
                            },
                            {
                              key: 'school',
                              header: 'School',
                              render: (lead: any) => lead.school || '-'
                            },
                            {
                              key: 'district',
                              header: 'District',
                              render: (lead: any) => lead.district || '-'
                            },
                            {
                              key: 'gender',
                              header: 'Gender',
                              render: (lead: any) => lead.gender || '-'
                            },
                            {
                              key: 'stream',
                              header: 'Stream',
                              render: (lead: any) => lead.stream || '-'
                            },
                            {
                              key: 'assigned_to',
                              header: 'Assigned To',
                              render: (lead: any) => lead.assigned_user ? (
                                <span className="font-medium">{lead.assigned_user.name || lead.assigned_user.email}</span>
                              ) : (
                                <span className="text-gray-400">Unassigned</span>
                              )
                            },
                            {
                              key: 'assignment_date',
                              header: 'Assignment Date',
                              render: (lead: any) => lead.assignment_date ? new Date(lead.assignment_date).toLocaleDateString() : '-'
                            }
                          ]}
                          emptyMessage="No leads found. Try adjusting your filters."
                        />
                      </InfiniteScroll>
                    ) : (
                      <DataTable
                        data={leads}
                        keyExtractor={(lead: any) => lead.id}
                        selectable={isAdmin}
                        selectedIds={selectedLeads}
                        onSelectionChange={setSelectedLeads}
                        columns={[
                          {
                            key: 'name',
                            header: 'Name',
                            render: (lead: any) => <span className="font-medium">{lead.name}</span>
                          },
                          {
                            key: 'phone',
                            header: 'Phone Number',
                            render: (lead: any) => lead.phone || '-'
                          },
                          {
                            key: 'school',
                            header: 'School',
                            render: (lead: any) => lead.school || '-'
                          },
                          {
                            key: 'district',
                            header: 'District',
                            render: (lead: any) => lead.district || '-'
                          },
                          {
                            key: 'gender',
                            header: 'Gender',
                            render: (lead: any) => lead.gender || '-'
                          },
                          {
                            key: 'stream',
                            header: 'Stream',
                            render: (lead: any) => lead.stream || '-'
                          },
                          {
                            key: 'assigned_to',
                            header: 'Assigned To',
                            render: (lead: any) => lead.assigned_user ? (
                              <span className="font-medium">{lead.assigned_user.name || lead.assigned_user.email}</span>
                            ) : (
                              <span className="text-gray-400">Unassigned</span>
                            )
                          },
                          {
                            key: 'assignment_date',
                            header: 'Assignment Date',
                            render: (lead: any) => lead.assignment_date ? new Date(lead.assignment_date).toLocaleDateString() : '-'
                          }
                        ]}
                        emptyMessage="No leads found. Try adjusting your filters."
                      />
                    )}

                    {/* Pagination Controls (Bottom) - Only for standard mode */}
                    {paginationMode === 'standard' && count > 0 && (
                      <div className="mt-4">
                        <Pagination
                          currentPage={page}
                          totalCount={count}
                          pageSize={pageSize}
                          onPageChange={setPage}
                          onPageSizeChange={setPageSize}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bulk Select Dialog */}
      {isAdmin && (
        <BulkSelectDialog
          open={showBulkSelect}
          onOpenChange={setShowBulkSelect}
          totalFilteredCount={count}
          currentSelectionCount={selectedLeads.size}
          onConfirm={handleBulkSelect}
        />
      )}

      {/* Bulk Assign Dialog */}
      {isAdmin && (
        <BulkAssignDialog
          open={showBulkAssign}
          onOpenChange={setShowBulkAssign}
          totalFilteredCount={count}
          selectedLeadIds={bulkSelectedCount > 0 ? [] : Array.from(selectedLeads)}
          onAssign={handleBulkAssign}
        />
      )}

      {/* Bulk Action Progress Dialog */}
      <BulkActionProgress
        open={bulkProgress.open}
        action={bulkProgress.action}
        total={bulkProgress.total}
        processed={bulkProgress.processed}
        status={bulkProgress.status}
        error={bulkProgress.error}
      />
    </div>
  )
}