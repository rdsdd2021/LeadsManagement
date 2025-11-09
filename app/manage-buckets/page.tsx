'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Loader2, FolderPlus } from 'lucide-react'
import type { LeadBucket, CustomField } from '@/types/lead'
import { CreateBucketDialog } from '@/components/buckets/CreateBucketDialog'
import { AddFieldDialog } from '@/components/buckets/AddFieldDialog'

export default function ManageBucketsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [buckets, setBuckets] = useState<LeadBucket[]>([])
  const [selectedBucket, setSelectedBucket] = useState<LeadBucket | null>(null)
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateBucket, setShowCreateBucket] = useState(false)
  const [showAddField, setShowAddField] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user && user.role !== 'admin') {
      router.push('/')
    } else if (user) {
      loadBuckets()
    }
  }, [user, authLoading, router])

  const loadBuckets = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('lead_buckets')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBuckets(data)
      if (data.length > 0 && !selectedBucket) {
        setSelectedBucket(data[0])
        loadCustomFields(data[0].id)
      }
    }
    setLoading(false)
  }

  const loadCustomFields = async (bucketId: string) => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('bucket_id', bucketId)
      .order('display_order')

    if (!error && data) {
      setCustomFields(data)
    }
  }

  const handleBucketSelect = (bucket: LeadBucket) => {
    setSelectedBucket(bucket)
    loadCustomFields(bucket.id)
  }

  const handleDeleteBucket = async (bucketId: string, bucketName: string) => {
    if (!confirm(`Are you sure you want to delete "${bucketName}"? This will also delete all custom fields associated with this bucket.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('lead_buckets')
        .delete()
        .eq('id', bucketId)

      if (error) throw error

      // Reload buckets
      await loadBuckets()
      
      // Clear selection if deleted bucket was selected
      if (selectedBucket?.id === bucketId) {
        setSelectedBucket(null)
        setCustomFields([])
      }
    } catch (err: any) {
      alert(`Failed to delete bucket: ${err.message}`)
    }
  }

  const handleDeleteField = async (fieldId: string, fieldLabel: string) => {
    if (!confirm(`Are you sure you want to delete the field "${fieldLabel}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', fieldId)

      if (error) throw error

      // Reload custom fields
      if (selectedBucket) {
        await loadCustomFields(selectedBucket.id)
      }
    } catch (err: any) {
      alert(`Failed to delete field: ${err.message}`)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Lead Buckets</h1>
          <p className="text-gray-600">
            Create and manage lead templates with custom fields for different types of leads
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Buckets List */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lead Buckets</CardTitle>
                  <Button size="sm" onClick={() => setShowCreateBucket(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Bucket
                  </Button>
                </div>
                <CardDescription>
                  Select a bucket to manage its custom fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {buckets.map((bucket) => (
                    <div
                      key={bucket.id}
                      onClick={() => handleBucketSelect(bucket)}
                      className={`
                        w-full text-left p-4 rounded-lg border-2 transition-colors cursor-pointer
                        ${selectedBucket?.id === bucket.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{bucket.name}</h3>
                          <p className="text-sm text-gray-600">{bucket.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {bucket.color && (
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: bucket.color }}
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBucket(bucket.id, bucket.name)
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custom Fields */}
          <div className="col-span-12 lg:col-span-8">
            {selectedBucket ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Custom Fields for {selectedBucket.name}</CardTitle>
                      <CardDescription>
                        Define custom fields that will be available when importing leads to this bucket
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowAddField(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {customFields.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No custom fields yet</p>
                      <Button onClick={() => setShowAddField(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Field
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{field.label}</h4>
                              {field.is_required && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Type: {field.field_type} • Name: {field.name}
                            </p>
                            {field.options && (
                              <p className="text-xs text-gray-500 mt-1">
                                Options: {Array.isArray(field.options) ? field.options.join(', ') : JSON.stringify(field.options)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteField(field.id, field.label)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">Select a bucket to view and manage its custom fields</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">How Lead Buckets Work</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Create different buckets for different types of leads (Real Estate, SaaS, Events, etc.)</li>
              <li>• Define custom fields specific to each bucket type</li>
              <li>• When importing CSV, users select a bucket and map CSV columns to bucket fields</li>
              <li>• All leads in a bucket share the same custom field structure</li>
              <li>• Custom fields are stored in the lead's custom_fields JSON column</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateBucketDialog
        open={showCreateBucket}
        onOpenChange={setShowCreateBucket}
        onSuccess={loadBuckets}
      />

      {selectedBucket && (
        <AddFieldDialog
          open={showAddField}
          onOpenChange={setShowAddField}
          bucketId={selectedBucket.id}
          bucketName={selectedBucket.name}
          onSuccess={() => loadCustomFields(selectedBucket.id)}
        />
      )}
    </div>
  )
}
