'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestAuthPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults: any = {}

    // Test 1: Check auth session
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      testResults.session = {
        success: !error,
        data: session ? {
          user_id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata
        } : null,
        error: error?.message
      }
    } catch (err: any) {
      testResults.session = { success: false, error: err.message }
    }

    // Test 2: Check users table access
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(5)
      
      testResults.usersTable = {
        success: !error,
        data: data,
        error: error?.message,
        details: error?.details,
        hint: error?.hint
      }
    } catch (err: any) {
      testResults.usersTable = { success: false, error: err.message }
    }

    // Test 3: Check current user role
    try {
      const user = await getCurrentUser()
      testResults.currentUser = {
        success: !!user,
        data: user
      }
    } catch (err: any) {
      testResults.currentUser = { success: false, error: err.message }
    }

    // Test 4: Check leads table access
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('count')
        .limit(1)
      
      testResults.leadsTable = {
        success: !error,
        error: error?.message
      }
    } catch (err: any) {
      testResults.leadsTable = { success: false, error: err.message }
    }

    setResults(testResults)
    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run Tests Again'}
            </Button>
          </CardContent>
        </Card>

        {Object.keys(results).length > 0 && (
          <>
            <TestResult
              title="1. Auth Session"
              result={results.session}
            />
            <TestResult
              title="2. Users Table Access"
              result={results.usersTable}
            />
            <TestResult
              title="3. Current User & Role"
              result={results.currentUser}
            />
            <TestResult
              title="4. Leads Table Access"
              result={results.leadsTable}
            />
          </>
        )}
      </div>
    </div>
  )
}

function TestResult({ title, result }: { title: string; result: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={result.success ? 'text-green-600' : 'text-red-600'}>
            {result.success ? '✅' : '❌'}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
