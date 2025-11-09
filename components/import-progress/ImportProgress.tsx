'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { X, Minimize2, Maximize2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ImportJob {
  id: string
  file_name: string
  status: string
  total_rows: number | null
  processed_rows: number
  success_count: number
  failed_count: number
  errors: any[]
}

interface ImportProgressProps {
  jobId: string
  onClose: () => void
}

export function ImportProgress({ jobId, onClose }: ImportProgressProps) {
  const [job, setJob] = useState<ImportJob | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!jobId) return

    // Initial fetch
    fetchJob()

    // Subscribe to updates
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
          console.log('Job update received:', payload.new)
          setJob(payload.new as ImportJob)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [jobId])

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) throw error
      if (data) {
        setJob(data)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Error fetching job:', err)
      setIsLoading(false)
    }
  }

  if (!job && !isLoading) return null

  const progress = job?.total_rows 
    ? (job.processed_rows / job.total_rows) * 100 
    : 0

  const isComplete = job?.status === 'completed' || job?.status === 'failed'
  const isProcessing = job?.status === 'processing'
  const isFailed = job?.status === 'failed'

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64 shadow-lg border-2">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {isComplete ? (
                isFailed ? (
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                )
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 flex-shrink-0" />
              )}
              <span className="text-sm font-medium truncate">
                {job?.file_name || 'Importing...'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              {isComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 shadow-lg border-2">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isComplete ? (
                isFailed ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              )}
              <h3 className="font-semibold text-sm">
                {isComplete 
                  ? isFailed ? 'Import Failed' : 'Import Complete'
                  : 'Importing Leads'
                }
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              {isComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* File name */}
          <p className="text-xs text-gray-600 truncate">
            {job?.file_name || 'Processing...'}
          </p>

          {/* Progress */}
          {isProcessing && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
              <p className="text-xs text-gray-600">
                {job?.processed_rows || 0} of {job?.total_rows || '...'} rows processed
              </p>
            </>
          )}

          {/* Results */}
          {isComplete && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-green-50 rounded text-center">
                <p className="text-xs text-gray-600">Success</p>
                <p className="text-lg font-bold text-green-600">{job?.success_count || 0}</p>
              </div>
              <div className="p-2 bg-red-50 rounded text-center">
                <p className="text-xs text-gray-600">Failed</p>
                <p className="text-lg font-bold text-red-600">{job?.failed_count || 0}</p>
              </div>
            </div>
          )}

          {/* Errors */}
          {isComplete && job?.errors && job.errors.length > 0 && (
            <div className="max-h-32 overflow-y-auto">
              <p className="text-xs font-medium mb-1">Errors:</p>
              {job.errors.slice(0, 5).map((err: any, idx: number) => (
                <p key={idx} className="text-xs text-red-600">
                  Row {err.row}: {err.error}
                </p>
              ))}
              {job.errors.length > 5 && (
                <p className="text-xs text-gray-600">
                  ... and {job.errors.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
