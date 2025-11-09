'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface BulkSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalFilteredCount: number
  currentSelectionCount: number
  onConfirm: (count: number) => void
}

export function BulkSelectDialog({
  open,
  onOpenChange,
  totalFilteredCount,
  currentSelectionCount,
  onConfirm,
}: BulkSelectDialogProps) {
  const [count, setCount] = useState<number>(currentSelectionCount || totalFilteredCount)
  const [error, setError] = useState<string>('')

  const handleConfirm = () => {
    if (count < 1) {
      setError('Please select at least 1 lead')
      return
    }
    if (count > totalFilteredCount) {
      setError(`Cannot select more than ${totalFilteredCount} leads`)
      return
    }
    onConfirm(count)
    onOpenChange(false)
  }

  const handleCountChange = (value: string) => {
    const num = parseInt(value) || 0
    setCount(num)
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Leads for Bulk Action</DialogTitle>
          <DialogDescription>
            Choose how many leads to select from your filtered results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Current Status:</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Total filtered leads: <strong>{totalFilteredCount}</strong></li>
                  {currentSelectionCount > 0 && (
                    <li>• Currently selected: <strong>{currentSelectionCount}</strong></li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Count Input */}
          <div className="space-y-2">
            <Label htmlFor="selectCount">Number of Leads to Select</Label>
            <Input
              id="selectCount"
              type="number"
              min={1}
              max={totalFilteredCount}
              value={count}
              onChange={(e) => handleCountChange(e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Maximum: {totalFilteredCount} leads
              </span>
              {error && (
                <span className="text-red-600">{error}</span>
              )}
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="space-y-2">
            <Label>Quick Select:</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCountChange('10')}
                disabled={totalFilteredCount < 10}
              >
                10
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCountChange('50')}
                disabled={totalFilteredCount < 50}
              >
                50
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCountChange('100')}
                disabled={totalFilteredCount < 100}
              >
                100
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCountChange(totalFilteredCount.toString())}
              >
                All
              </Button>
            </div>
          </div>

          {/* Preview */}
          {count > 0 && count <= totalFilteredCount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-medium mb-1">Selection Preview:</p>
                  <p className="text-green-800">
                    <strong>{count}</strong> leads will be selected from your filtered results
                    (newest first)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Leads are selected in order (newest first)</p>
            <p>• Selection respects your current filters</p>
            <p>• You can perform bulk actions after selection</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={count < 1 || count > totalFilteredCount}>
            Select {count} Leads
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
