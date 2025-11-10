'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface BulkActionProgressProps {
  open: boolean
  action: 'assign' | 'delete'
  total: number
  processed: number
  status: 'processing' | 'success' | 'error'
  error?: string
}

export function BulkActionProgress({
  open,
  action,
  total,
  processed,
  status,
  error,
}: BulkActionProgressProps) {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0
  const actionText = action === 'assign' ? 'Assigning' : 'Deleting'
  const actionPastText = action === 'assign' ? 'assigned' : 'deleted'

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === 'processing' && `${actionText} Leads...`}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === 'processing' && (
            <>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-gray-700">
                  {actionText} {processed} of {total} leads...
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
              <p className="text-xs text-gray-500 text-center">{percentage}% complete</p>
            </>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-sm font-medium text-gray-900">
                Successfully {actionPastText} {processed} leads
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <p className="text-sm font-medium text-gray-900">Failed to {action} leads</p>
              {error && (
                <p className="text-xs text-red-600 text-center max-w-sm">{error}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
