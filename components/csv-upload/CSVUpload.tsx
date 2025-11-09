'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CSVMapping, ImportResult } from '@/types/lead'

interface CSVUploadProps {
  onComplete?: (result: ImportResult) => void
}

export function CSVUpload({ onComplete }: CSVUploadProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCSVData] = useState<any[]>([])
  const [csvHeaders, setCSVHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<CSVMapping[]>([])
  const [step, setStep] = useState<'bucket' | 'upload' | 'map' | 'preview' | 'importing'>('bucket')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string>('')
  const [buckets, setBuckets] = useState<any[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>('')
  const [customFields, setCustomFields] = useState<any[]>([])

  // Load buckets on mount
  useEffect(() => {
    loadBuckets()
  }, [])

  const loadBuckets = async () => {
    const { data } = await supabase
      .from('lead_buckets')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (data) {
      setBuckets(data)
    }
  }

  const loadCustomFields = async (bucketId: string) => {
    const { data } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('bucket_id', bucketId)
      .order('display_order')
    
    if (data) {
      setCustomFields(data)
    }
  }

  // Standard lead fields
  const leadFields = [
    { value: 'name', label: 'Name *', required: true },
    { value: 'email', label: 'Email', required: false },
    { value: 'phone', label: 'Phone', required: false },
    { value: 'status', label: 'Status *', required: true },
    { value: 'category', label: 'Category *', required: true },
    { value: 'region', label: 'Region', required: false },
    { value: 'value', label: 'Value', required: false },
    { value: 'priority', label: 'Priority', required: false },
    { value: 'team', label: 'Team', required: false },
  ]

  // Simple CSV parser (no external dependencies)
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return { headers: [], data: [] }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: any = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      return row
    })

    return { headers, data }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const { headers, data } = parseCSV(text)

        if (data.length === 0) {
          setError('CSV file is empty')
          return
        }

        setCSVHeaders(headers)
        setCSVData(data)
        
        // Auto-map fields with matching names
        const autoMappings: CSVMapping[] = headers.map(csvCol => {
          const normalizedCol = csvCol.toLowerCase().trim()
          const matchedField = leadFields.find(f => 
            f.value.toLowerCase() === normalizedCol ||
            f.label.toLowerCase().includes(normalizedCol)
          )
          
          return {
            csvColumn: csvCol,
            leadField: matchedField?.value || '',
            isCustomField: false
          }
        })
        
        setMappings(autoMappings)
        setStep('map')
      } catch (err: any) {
        setError(`Failed to parse CSV: ${err.message}`)
      }
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  const handleMappingChange = (csvColumn: string, leadField: string, isCustomField: boolean) => {
    setMappings(prev => prev.map(m => 
      m.csvColumn === csvColumn 
        ? { ...m, leadField, isCustomField }
        : m
    ))
  }

  const validateMappings = (): boolean => {
    const requiredFields = leadFields.filter(f => f.required).map(f => f.value)
    const mappedFields = mappings.filter(m => m.leadField).map(m => m.leadField)
    
    const missingFields = requiredFields.filter(f => !mappedFields.includes(f))
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`)
      return false
    }
    
    return true
  }

  const handleImport = async () => {
    if (!validateMappings()) return
    
    setStep('importing')
    setError('')
    
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    try {
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i]
        
        try {
          // Map CSV data to lead object
          const leadData: any = {
            created_by: user?.id,
            bucket_id: selectedBucket || null,
            custom_fields: {}
          }
          
          mappings.forEach(mapping => {
            if (!mapping.leadField) return
            
            const value = row[mapping.csvColumn]
            
            if (mapping.isCustomField) {
              // Remove 'custom_' prefix for storage
              const fieldName = mapping.leadField.replace('custom_', '')
              leadData.custom_fields[fieldName] = value
            } else {
              // Transform value based on field type
              if (mapping.leadField === 'value' || mapping.leadField === 'priority') {
                leadData[mapping.leadField] = parseFloat(value) || 0
              } else {
                leadData[mapping.leadField] = value
              }
            }
          })
          
          // Insert into database
          const { error: insertError } = await supabase
            .from('leads')
            .insert(leadData)
          
          if (insertError) {
            result.failed++
            result.errors.push({
              row: i + 1,
              error: insertError.message
            })
          } else {
            result.success++
          }
        } catch (err: any) {
          result.failed++
          result.errors.push({
            row: i + 1,
            error: err.message
          })
        }
      }
      
      setImportResult(result)
      onComplete?.(result)
    } catch (err: any) {
      setError(`Import failed: ${err.message}`)
    }
  }

  const handleBucketSelect = async (bucketId: string) => {
    setSelectedBucket(bucketId)
    await loadCustomFields(bucketId)
    setStep('upload')
  }

  const reset = () => {
    setFile(null)
    setCSVData([])
    setCSVHeaders([])
    setMappings([])
    setStep('bucket')
    setImportResult(null)
    setError('')
    setSelectedBucket('')
    setCustomFields([])
  }

  // Bucket selection step
  if (step === 'bucket') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Lead Bucket</CardTitle>
          <p className="text-sm text-gray-600">
            Choose which bucket template to use for importing these leads
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {buckets.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No buckets available. Please create a bucket first.
            </p>
          ) : (
            buckets.map(bucket => (
              <button
                key={bucket.id}
                onClick={() => handleBucketSelect(bucket.id)}
                className="w-full text-left p-4 border-2 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{bucket.name}</h3>
                    <p className="text-sm text-gray-600">{bucket.description}</p>
                  </div>
                  {bucket.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                  )}
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'importing') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg font-medium">Importing leads...</p>
          <p className="text-sm text-gray-600">Please wait while we process your data</p>
        </CardContent>
      </Card>
    )
  }

  if (importResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Import Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Successfully Imported</p>
              <p className="text-3xl font-bold text-green-600">{importResult.success}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
            </div>
          </div>
          
          {importResult.errors.length > 0 && (
            <div className="mt-4">
              <p className="font-medium mb-2">Errors:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {importResult.errors.slice(0, 10).map((err, idx) => (
                  <p key={idx} className="text-sm text-red-600">
                    Row {err.row}: {err.error}
                  </p>
                ))}
                {importResult.errors.length > 10 && (
                  <p className="text-sm text-gray-600">
                    ... and {importResult.errors.length - 10} more errors
                  </p>
                )}
              </div>
            </div>
          )}
          
          <Button onClick={reset} className="w-full">
            Import Another File
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'map') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map CSV Columns to Lead Fields</CardTitle>
          <p className="text-sm text-gray-600">
            Match your CSV columns to the lead fields. Fields marked with * are required.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="space-y-3">
            {mappings.map((mapping, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">{mapping.csvColumn}</label>
                  <p className="text-xs text-gray-500">
                    Sample: {csvData[0]?.[mapping.csvColumn]}
                  </p>
                </div>
                
                <div className="flex-1">
                  <select
                    value={mapping.leadField}
                    onChange={(e) => {
                      const isCustom = e.target.value.startsWith('custom_')
                      handleMappingChange(mapping.csvColumn, e.target.value, isCustom)
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- Skip this column --</option>
                    <optgroup label="Standard Fields">
                      {leadFields.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </optgroup>
                    {customFields.length > 0 && (
                      <optgroup label="Custom Fields">
                        {customFields.map(field => (
                          <option key={field.id} value={`custom_${field.name}`}>
                            {field.label} ({field.field_type})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => setStep('preview')} className="flex-1">
              Preview Import
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'preview') {
    const previewData = csvData.slice(0, 5)
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview Import</CardTitle>
          <p className="text-sm text-gray-600">
            Review the first 5 rows before importing {csvData.length} leads
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {mappings.filter(m => m.leadField).map((m, idx) => (
                    <th key={idx} className="px-3 py-2 text-left font-medium">
                      {m.leadField}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-t">
                    {mappings.filter(m => m.leadField).map((m, colIdx) => (
                      <td key={colIdx} className="px-3 py-2">
                        {row[m.csvColumn]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('map')} className="flex-1">
              Back to Mapping
            </Button>
            <Button onClick={handleImport} className="flex-1">
              Import {csvData.length} Leads
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <p className="text-sm text-gray-600">
          Upload a CSV file to import leads. The file should include columns for name, email, status, etc.
        </p>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            Select a CSV file to upload
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Supports .csv files up to 10MB
          </p>
          <label className="inline-block cursor-pointer">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <Button type="button" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </span>
            </Button>
          </label>
        </div>
        
        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
