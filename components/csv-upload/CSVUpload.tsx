'use client'

import { useState, useEffect, ChangeEvent, DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ImportResult } from '@/types/lead'

interface CSVUploadProps {
  onComplete?: (result: ImportResult) => void
}

interface ImportJob {
  id: string
  status: string
  total_rows: number | null
  processed_rows: number
  success_count: number
  failed_count: number
  errors: any[]
}

interface ColumnMapping {
  csvColumn: string
  leadField: string
}

export function CSVUpload({ onComplete }: CSVUploadProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<'bucket' | 'upload' | 'mapping' | 'uploading' | 'processing' | 'complete'>('bucket')
  const [error, setError] = useState<string>('')
  const [buckets, setBuckets] = useState<any[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>('')
  const [customFields, setCustomFields] = useState<any[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // CSV parsing and mapping
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])

  useEffect(() => {
    loadBuckets()
  }, [])

  useEffect(() => {
    if (!currentJob) return
    
    const jobId = currentJob.id
    const jobStatus = currentJob.status
    
    if (jobStatus !== 'processing' && jobStatus !== 'pending') return
    
    console.log('Setting up realtime subscription for job:', jobId)
    
    const channel = supabase
      .channel(`import-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          console.log('Realtime update received:', payload)
          const updatedJob = payload.new as ImportJob
          setCurrentJob(updatedJob)
          
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            console.log('Import completed:', updatedJob.status)
            setStep('complete')
            
            if (onComplete) {
              onComplete({
                success: updatedJob.success_count,
                failed: updatedJob.failed_count,
                errors: updatedJob.errors.map((e: any) => ({
                  row: e.row,
                  error: e.error
                }))
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    // Also poll for updates as backup
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      
      if (data) {
        console.log('Polling update:', data)
        setCurrentJob(data)
        
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval)
          setStep('complete')
          
          if (onComplete) {
            onComplete({
              success: data.success_count,
              failed: data.failed_count,
              errors: data.errors.map((e: any) => ({
                row: e.row,
                error: e.error
              }))
            })
          }
        }
      }
    }, 2000) // Poll every 2 seconds

    return () => {
      console.log('Cleaning up subscription')
      channel.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [currentJob?.id, currentJob?.status, onComplete])

  const loadBuckets = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_buckets')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      if (data) {
        setBuckets(data)
      }
    } catch (err: any) {
      console.error('Error loading buckets:', err)
      setError('Failed to load buckets')
    }
  }

  const loadCustomFields = async (bucketId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('bucket_id', bucketId)
        .order('display_order')
      
      if (error) throw error
      if (data) {
        setCustomFields(data)
      }
    } catch (err: any) {
      console.error('Error loading custom fields:', err)
      // Don't show error if no custom fields exist
      setCustomFields([])
    }
  }

  const downloadSampleCSV = () => {
    const selectedBucketInfo = buckets.find(b => b.id === selectedBucket)
    
    const headers = ['Name', 'Phone Number', 'School', 'District', 'Gender', 'Stream']
    
    customFields.forEach(field => {
      headers.push(field.label)
    })
    
    const sampleRows = [
      [
        'John Doe',
        '1234567890',
        'Springfield High School',
        'Springfield',
        'Male',
        'Science',
        ...customFields.map(f => {
          if (f.field_type === 'select' && f.options) {
            return f.options[0] || ''
          } else if (f.field_type === 'number') {
            return '100'
          } else if (f.field_type === 'date') {
            return '2024-01-15'
          } else if (f.field_type === 'boolean') {
            return 'true'
          }
          return 'Sample value'
        })
      ],
      [
        'Jane Smith',
        '0987654321',
        'Riverside Academy',
        'Riverside',
        'Female',
        'Commerce',
        ...customFields.map(f => {
          if (f.field_type === 'select' && f.options && f.options.length > 1) {
            return f.options[1] || ''
          } else if (f.field_type === 'number') {
            return '200'
          } else if (f.field_type === 'date') {
            return '2024-01-16'
          } else if (f.field_type === 'boolean') {
            return 'false'
          }
          return 'Another sample'
        })
      ]
    ]
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const fileName = `sample_leads_${selectedBucketInfo?.name.replace(/\s+/g, '_').toLowerCase() || 'template'}.csv`
    
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  }

  const parseCSV = async (file: File) => {
    return new Promise<{ headers: string[], rows: string[][] }>((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'))
            return
          }
          
          // Helper function to parse CSV line properly (handles quoted values with commas)
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = []
            let current = ''
            let inQuotes = false
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              const nextChar = line[i + 1]
              
              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  // Escaped quote
                  current += '"'
                  i++ // Skip next quote
                } else {
                  // Toggle quote state
                  inQuotes = !inQuotes
                }
              } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            
            // Add last field
            result.push(current.trim())
            
            return result
          }
          
          // Parse headers
          const headers = parseCSVLine(lines[0])
          
          // Parse first 5 rows for preview
          const rows: string[][] = []
          for (let i = 1; i < Math.min(6, lines.length); i++) {
            const values = parseCSVLine(lines[i])
            rows.push(values)
          }
          
          resolve({ headers, rows })
        } catch (err) {
          reject(err)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const validateFile = (selectedFile: File): boolean => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return false
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return false
    }

    return true
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      setError('')
      
      // Parse CSV and show mapping
      try {
        const { headers, rows } = await parseCSV(selectedFile)
        setCsvHeaders(headers)
        setCsvPreview(rows)
        
        // Auto-map columns
        const autoMappings = autoMapColumns(headers)
        setColumnMappings(autoMappings)
        
        setStep('mapping')
      } catch (err: any) {
        setError(err.message)
      }
    }
  }

  const autoMapColumns = (headers: string[]): ColumnMapping[] => {
    const mappings: ColumnMapping[] = []
    
    // Create a map of custom field labels for quick lookup
    const customFieldLabels = customFields.map(f => f.label.toLowerCase())
    
    // Try to auto-map required fields and custom fields
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim()
      
      // Check required fields first
      if (normalizedHeader.includes('name') && !normalizedHeader.includes('school')) {
        mappings.push({ csvColumn: header, leadField: 'Name' })
      } else if (normalizedHeader.includes('phone')) {
        mappings.push({ csvColumn: header, leadField: 'Phone Number' })
      } else if (normalizedHeader.includes('school')) {
        mappings.push({ csvColumn: header, leadField: 'School' })
      } else if (normalizedHeader.includes('district')) {
        mappings.push({ csvColumn: header, leadField: 'District' })
      } else if (normalizedHeader.includes('gender')) {
        mappings.push({ csvColumn: header, leadField: 'Gender' })
      } else if (normalizedHeader.includes('stream') || normalizedHeader.includes('course')) {
        mappings.push({ csvColumn: header, leadField: 'Stream' })
      } else {
        // Try to match with custom fields
        const matchingCustomField = customFields.find(
          f => f.label.toLowerCase() === normalizedHeader || 
               normalizedHeader.includes(f.label.toLowerCase())
        )
        
        if (matchingCustomField) {
          mappings.push({ csvColumn: header, leadField: matchingCustomField.label })
        } else {
          // Leave unmapped
          mappings.push({ csvColumn: header, leadField: '' })
        }
      }
    })
    
    return mappings
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) return

    if (validateFile(droppedFile)) {
      setFile(droppedFile)
      setError('')
      
      // Parse CSV and show mapping
      try {
        const { headers, rows } = await parseCSV(droppedFile)
        setCsvHeaders(headers)
        setCsvPreview(rows)
        
        // Auto-map columns
        const autoMappings = autoMapColumns(headers)
        setColumnMappings(autoMappings)
        
        setStep('mapping')
      } catch (err: any) {
        setError(err.message)
      }
    }
  }

  const updateMapping = (csvColumn: string, leadField: string) => {
    setColumnMappings(prev => 
      prev.map(m => m.csvColumn === csvColumn ? { ...m, leadField } : m)
    )
  }

  const validateMappings = (): boolean => {
    const requiredFields = ['Name', 'Phone Number', 'School', 'District', 'Gender', 'Stream']
    const mappedFields = columnMappings.filter(m => m.leadField).map(m => m.leadField)
    
    const missingFields = requiredFields.filter(f => !mappedFields.includes(f))
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`)
      return false
    }
    
    return true
  }

  const handleUploadAndImport = async () => {
    if (!file || !user) return

    if (!validateMappings()) return

    setError('')
    setStep('uploading')
    setUploadProgress(0)

    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('csv-imports')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setUploadProgress(100)

      // Create import job
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          bucket_id: selectedBucket,
          file_path: filePath,
          file_name: file.name,
          status: 'pending'
        })
        .select()
        .single()

      if (jobError) {
        throw new Error(`Failed to create import job: ${jobError.message}`)
      }

      setCurrentJob(jobData)
      setStep('processing')

      // Trigger edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('import-csv-leads', {
        body: { 
          jobId: jobData.id,
          columnMappings: columnMappings.filter(m => m.leadField)
        }
      })

      if (functionError) {
        throw new Error(`Import failed: ${functionError.message}`)
      }

    } catch (err: any) {
      console.error('Upload/Import error:', err)
      setError(err.message)
      setStep('mapping')
    }
  }

  const handleBucketSelect = async (bucketId: string) => {
    setSelectedBucket(bucketId)
    await loadCustomFields(bucketId)
    setStep('upload')
  }

  const reset = () => {
    setFile(null)
    setStep('bucket')
    setError('')
    setSelectedBucket('')
    setCustomFields([])
    setUploadProgress(0)
    setCurrentJob(null)
    setCsvHeaders([])
    setCsvPreview([])
    setColumnMappings([])
  }

  // Render bucket selection
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

  // Render uploading state
  if (step === 'uploading') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading file...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render processing state
  if (step === 'processing' && currentJob) {
    const progress = currentJob.total_rows 
      ? (currentJob.processed_rows / currentJob.total_rows) * 100 
      : 0

    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing leads...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-gray-600 text-center">
              {currentJob.processed_rows} of {currentJob.total_rows || '...'} rows processed
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render complete state
  if (step === 'complete' && currentJob) {
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
              <p className="text-3xl font-bold text-green-600">{currentJob.success_count}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-3xl font-bold text-red-600">{currentJob.failed_count}</p>
            </div>
          </div>
          
          {currentJob.errors.length > 0 && (
            <div className="mt-4">
              <p className="font-medium mb-2">Errors:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {currentJob.errors.slice(0, 10).map((err: any, idx) => (
                  <p key={idx} className="text-sm text-red-600">
                    Row {err.row}: {err.error}
                  </p>
                ))}
                {currentJob.errors.length > 10 && (
                  <p className="text-sm text-gray-600">
                    ... and {currentJob.errors.length - 10} more errors
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

  // Render column mapping step
  if (step === 'mapping') {
    const requiredFields = ['Name', 'Phone Number', 'School', 'District', 'Gender', 'Stream']
    const availableFields = [...requiredFields, ...customFields.map(f => f.label)]
    
    // Debug log
    console.log('Custom fields available for mapping:', customFields)
    console.log('Available fields for dropdown:', availableFields)
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Map CSV Columns</CardTitle>
          <p className="text-sm text-gray-600">
            Map your CSV columns to lead fields. Required fields must be mapped.
            {customFields.length > 0 && (
              <span className="block mt-1 text-blue-600">
                {customFields.length} custom field{customFields.length > 1 ? 's' : ''} available for this bucket
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium mb-2">CSV Preview (first 5 rows):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {csvHeaders.map((header, idx) => (
                      <th key={idx} className="px-2 py-1 text-left font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-2 py-1">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mappings */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Column Mappings:</p>
            {columnMappings.map((mapping, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1 p-2 bg-gray-100 rounded">
                  <p className="text-sm font-medium">{mapping.csvColumn}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <select
                  value={mapping.leadField}
                  onChange={(e) => updateMapping(mapping.csvColumn, e.target.value)}
                  className="flex-1 p-2 border rounded"
                >
                  <option value="">-- Skip this column --</option>
                  {availableFields.map(field => (
                    <option key={field} value={field}>
                      {field} {requiredFields.includes(field) ? '*' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
              Back
            </Button>
            <Button onClick={handleUploadAndImport} className="flex-1">
              Confirm and Import
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render upload step
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <p className="text-sm text-gray-600">
          Upload a CSV file to import leads. Required columns: Name, Phone Number, School, District, Gender, Stream.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSampleCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download Sample CSV
          </Button>
        </div>

        <div 
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileSpreadsheet className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-lg font-medium mb-2">
            {file ? file.name : isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {isDragging ? 'Release to upload' : 'or click to browse • Supports .csv files up to 10MB'}
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button type="button" asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </span>
            </Button>
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
