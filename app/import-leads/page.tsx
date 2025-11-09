'use client'

import { CSVUpload } from '@/components/csv-upload/CSVUpload'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ImportLeadsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  // Only admins and managers can import leads
  if (user.role !== 'admin' && user.role !== 'manager') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">
              Only administrators and managers can import leads.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Leads</h1>
            <p className="text-gray-600">
              Upload a CSV file to bulk import leads into the system
            </p>
          </div>

          <CSVUpload
            onComplete={(result) => {
              console.log('Import complete:', result)
              // Optionally redirect or show success message
            }}
          />

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">CSV Format Guidelines:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Required columns:</strong> Name, Phone Number, School, District, Gender, Stream</li>
              <li>• <strong>Gender values:</strong> Male, Female, Other, Prefer not to say</li>
              <li>• <strong>Stream examples:</strong> Science, Commerce, Arts, Engineering, Medical, etc.</li>
              <li>• <strong>Custom fields:</strong> Additional columns will be mapped to bucket-specific custom fields</li>
              <li>• <strong>Tip:</strong> Download the sample CSV template after selecting a bucket for the correct format</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
