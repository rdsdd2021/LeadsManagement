'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PerformanceTestPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults: any = {}

    // Test 1: Count total leads
    console.log('Test 1: Counting total leads...')
    const startCount = performance.now()
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
    const endCount = performance.now()
    
    testResults.totalCount = {
      count,
      time: Math.round(endCount - startCount),
      error: countError?.message
    }

    // Test 2: Old method (fetch all rows - will hit 1000 limit)
    console.log('Test 2: Old method (fetch all for unique values)...')
    const startOld = performance.now()
    const { data: oldData, error: oldError } = await supabase
      .from('leads')
      .select('status, category, region')
    const endOld = performance.now()
    
    const oldUniqueStatuses = [...new Set(oldData?.map(r => r.status).filter(Boolean))]
    const oldUniqueCategories = [...new Set(oldData?.map(r => r.category).filter(Boolean))]
    const oldUniqueRegions = [...new Set(oldData?.map(r => r.region).filter(Boolean))]
    
    testResults.oldMethod = {
      rowsFetched: oldData?.length || 0,
      time: Math.round(endOld - startOld),
      uniqueStatuses: oldUniqueStatuses.length,
      uniqueCategories: oldUniqueCategories.length,
      uniqueRegions: oldUniqueRegions.length,
      error: oldError?.message,
      warning: oldData?.length === 1000 ? '⚠️ Hit 1000 row limit! Incomplete data!' : null
    }

    // Test 3: New method (using RPC function)
    console.log('Test 3: New method (RPC function)...')
    const startNew = performance.now()
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_unique_filter_values')
    const endNew = performance.now()
    
    testResults.newMethod = {
      time: Math.round(endNew - startNew),
      uniqueStatuses: rpcData?.status?.length || 0,
      uniqueCategories: rpcData?.category?.length || 0,
      uniqueRegions: rpcData?.region?.length || 0,
      error: rpcError?.message,
      data: rpcData
    }

    // Test 4: Paginated query (100 rows)
    console.log('Test 4: Paginated query (100 rows)...')
    const startPaginated = performance.now()
    const { data: paginatedData, error: paginatedError } = await supabase
      .from('leads')
      .select('*')
      .range(0, 99)
      .order('created_at', { ascending: false })
    const endPaginated = performance.now()
    
    testResults.paginatedQuery = {
      rowsFetched: paginatedData?.length || 0,
      time: Math.round(endPaginated - startPaginated),
      error: paginatedError?.message
    }

    // Test 5: Filtered query
    console.log('Test 5: Filtered query...')
    const startFiltered = performance.now()
    const { data: filteredData, count: filteredCount, error: filteredError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('status', 'new')
      .range(0, 99)
    const endFiltered = performance.now()
    
    testResults.filteredQuery = {
      rowsFetched: filteredData?.length || 0,
      totalMatching: filteredCount,
      time: Math.round(endFiltered - startFiltered),
      error: filteredError?.message
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Test Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={loading} size="lg">
              {loading ? 'Running Tests...' : 'Run Performance Tests'}
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              This will test various query methods to compare performance
            </p>
          </CardContent>
        </Card>

        {Object.keys(results).length > 0 && (
          <>
            <TestResult
              title="1. Total Lead Count"
              result={results.totalCount}
              description="How many leads are in the database"
            />
            
            <TestResult
              title="2. Old Method (Fetch All Rows)"
              result={results.oldMethod}
              description="Current implementation - fetches all rows then filters unique values"
              warning={results.oldMethod?.warning}
            />
            
            <TestResult
              title="3. New Method (RPC Function)"
              result={results.newMethod}
              description="Optimized implementation - uses PostgreSQL DISTINCT"
            />
            
            <TestResult
              title="4. Paginated Query (100 rows)"
              result={results.paginatedQuery}
              description="Standard pagination query"
            />
            
            <TestResult
              title="5. Filtered Query"
              result={results.filteredQuery}
              description="Query with status filter + pagination"
            />

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Old Method Speed:</span>
                    <strong>{results.oldMethod?.time}ms</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>New Method Speed:</span>
                    <strong className="text-green-600">{results.newMethod?.time}ms</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed Improvement:</span>
                    <strong className="text-green-600">
                      {results.oldMethod?.time && results.newMethod?.time
                        ? `${Math.round((results.oldMethod.time / results.newMethod.time) * 100) / 100}x faster`
                        : 'N/A'}
                    </strong>
                  </div>
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="font-semibold mb-2">Recommendation:</p>
                    {results.oldMethod?.warning ? (
                      <p className="text-red-600">
                        ⚠️ Old method hit the 1000 row limit! Use the new RPC method.
                      </p>
                    ) : (
                      <p className="text-green-600">
                        ✅ Both methods work, but RPC is {Math.round((results.oldMethod?.time / results.newMethod?.time) * 100) / 100}x faster
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function TestResult({ title, result, description, warning }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result?.error ? '❌' : '✅'}
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        {warning && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            {warning}
          </div>
        )}
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
