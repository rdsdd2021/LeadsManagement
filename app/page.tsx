'use client'

import { useLeads } from '@/hooks/useLeads'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const { data, isLoading, error } = useLeads()
  const [authStatus, setAuthStatus] = useState<string>('checking...')

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthStatus(`✅ Authenticated as: ${session.user.email}`)
      } else {
        setAuthStatus('❌ NOT authenticated')
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
         <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lead Management System</h1>
              <p className="text-sm text-muted-foreground">
              Real-time lead tracking and management
              </p>
        <p className="text-xs text-gray-500 mt-1">{authStatus}</p>
        </div>
      
      {/* Add this button: */}
      <button
        onClick={async () => {
          const { signInAsAdmin } = await import('@/lib/auth')
          await signInAsAdmin()
          window.location.reload()
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Sign In as Admin
      </button>
         </div>
        </div>
      </header>

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