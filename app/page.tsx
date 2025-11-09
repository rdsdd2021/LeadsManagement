'use client'

import { useLeads } from '@/hooks/useLeads'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { data, isLoading, error } = useLeads()
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

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
            <FilterPanel />
          </div>

          {/* Data Table */}
          <div className="col-span-12 lg:col-span-9">
            <Card>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading leads...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600">Error: {error.message}</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">
                        Leads ({data?.count || 0})
                      </h2>
                    </div>

                    {/* Simple Table for now - we'll enhance this in Phase 7 */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-y">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Region
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Value
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Custom Fields
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {data?.data.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium">
                                {lead.name}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Badge
                                  variant={
                                    lead.status === 'closed'
                                      ? 'default'
                                      : lead.status === 'qualified'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                >
                                  {lead.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {lead.category}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {lead.region || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                ${lead.value.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(lead.custom_fields).map(([key, value]) => (
                                      <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {key}: {String(value)}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {data?.data.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          No leads found. Try adjusting your filters.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}