'use client'

import { useLeads } from '@/hooks/useLeads'
import { useInfiniteLeads } from '@/hooks/useInfiniteLeads'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Loader2, CheckSquare, Square, List, Infinity, MousePointerClick } from 'lucide-react'
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
import { supabase } from '@/lib/supabase'
import { RealtimeStatus } from '@/components/debug/RealtimeStatus'

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Clear selection when data changes
  useEffect(() => {
    setSelectedLeads(new Set())
  }, [data])

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

  const toggleSelectAll = () => {
    if (selectedLeads.size === data?.data.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(data?.data.map((lead) => lead.id) || []))
    }
  }

  const toggleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Filter Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <RealtimeStatus />
            <FilterPanel />
          </div>

          {/* Data Table */}
          <div className="col-span-12 lg:col-span-9">
            <Card>
              <CardContent className="p-6">
                {isDataLoading && paginationMode === 'standard' ? (
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
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold">
                          Leads ({count})
                        </h2>
                        {getTotalSelectedCount() > 0 && (
                          <span className="text-sm font-medium text-blue-600">
                            {getTotalSelectedCount()} selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Pagination Mode Toggle */}
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
                        
                        {/* Bulk Select Button */}
                        {isAdmin && count > 0 && (
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
                    <div className="overflow-x-auto">
                      {paginationMode === 'infinite' ? (
                        <InfiniteScroll
                          onLoadMore={fetchNextPage}
                          hasMore={hasNextPage || false}
                          loading={isFetchingNextPage}
                        >
                          <table className="w-full">
                            <thead className="bg-gray-50 border-y sticky top-0">
                              <tr>
                                {isAdmin && (
                                  <th className="px-4 py-3 text-left w-12">
                                    <button
                                      onClick={toggleSelectAll}
                                      className="hover:bg-gray-200 rounded p-1"
                                    >
                                      {selectedLeads.size === leads.length ? (
                                        <CheckSquare className="h-4 w-4" />
                                      ) : (
                                        <Square className="h-4 w-4" />
                                      )}
                                    </button>
                                  </th>
                                )}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Phone Number
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  School
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  District
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Gender
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Stream
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Assigned To
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Assignment Date
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50">
                                  {isAdmin && (
                                    <td className="px-4 py-3">
                                      <button
                                        onClick={() => toggleSelectLead(lead.id)}
                                        className="hover:bg-gray-200 rounded p-1"
                                      >
                                        {selectedLeads.has(lead.id) ? (
                                          <CheckSquare className="h-4 w-4 text-blue-600" />
                                        ) : (
                                          <Square className="h-4 w-4" />
                                        )}
                                      </button>
                                    </td>
                                  )}
                                  <td className="px-4 py-3 text-sm font-medium">
                                    {lead.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {lead.phone || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {lead.school || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {lead.district || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {lead.gender || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {lead.stream || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {lead.assigned_user ? (
                                      <span className="font-medium">{lead.assigned_user.name || lead.assigned_user.email}</span>
                                    ) : (
                                      <span className="text-gray-400">Unassigned</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {lead.assignment_date ? new Date(lead.assignment_date).toLocaleDateString() : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </InfiniteScroll>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 border-y">
                            <tr>
                              {isAdmin && (
                                <th className="px-4 py-3 text-left w-12">
                                  <button
                                    onClick={toggleSelectAll}
                                    className="hover:bg-gray-200 rounded p-1"
                                  >
                                    {selectedLeads.size === leads.length ? (
                                      <CheckSquare className="h-4 w-4" />
                                    ) : (
                                      <Square className="h-4 w-4" />
                                    )}
                                  </button>
                                </th>
                              )}
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Phone Number
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                School
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                District
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Gender
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Stream
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Assigned To
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Assignment Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {leads.map((lead) => (
                              <tr key={lead.id} className="hover:bg-gray-50">
                                {isAdmin && (
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => toggleSelectLead(lead.id)}
                                      className="hover:bg-gray-200 rounded p-1"
                                    >
                                      {selectedLeads.has(lead.id) ? (
                                        <CheckSquare className="h-4 w-4 text-blue-600" />
                                      ) : (
                                        <Square className="h-4 w-4" />
                                      )}
                                    </button>
                                  </td>
                                )}
                                <td className="px-4 py-3 text-sm font-medium">
                                  {lead.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {lead.phone || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {lead.school || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {lead.district || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {lead.gender || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {lead.stream || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {lead.assigned_user ? (
                                    <span className="font-medium">{lead.assigned_user.name || lead.assigned_user.email}</span>
                                  ) : (
                                    <span className="text-gray-400">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {lead.assignment_date ? new Date(lead.assignment_date).toLocaleDateString() : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {leads.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          No leads found. Try adjusting your filters.
                        </div>
                      )}
                    </div>

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
          </div>
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