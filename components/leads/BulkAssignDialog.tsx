'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { supabase } from '@/lib/supabase'
import { Loader2, Users, UserCheck } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface UserAssignment {
  userId: string
  count: number
}

interface BulkAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalFilteredCount: number
  selectedLeadIds: string[]
  onAssign: (assignments: UserAssignment[]) => Promise<void>
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  totalFilteredCount,
  selectedLeadIds,
  onAssign,
}: BulkAssignDialogProps) {
  const [distributionMode, setDistributionMode] = useState<'equal' | 'custom'>('equal')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [customCounts, setCustomCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Use the count that was already selected
  const assignCount = selectedLeadIds.length > 0 ? selectedLeadIds.length : totalFilteredCount

  useEffect(() => {
    if (open) {
      loadUsers()
      setSelectedUsers([])
      setCustomCounts({})
    }
  }, [open])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .in('role', ['admin', 'manager', 'sales_rep'])
        .order('full_name')

      if (!error && data) {
        setUsers(data)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }



  const calculateDistribution = (): UserAssignment[] => {
    if (selectedUsers.length === 0) return []

    if (distributionMode === 'equal') {
      const perUser = Math.floor(assignCount / selectedUsers.length)
      const remainder = assignCount % selectedUsers.length

      return selectedUsers.map((userId, index) => ({
        userId,
        count: perUser + (index < remainder ? 1 : 0),
      }))
    } else {
      return selectedUsers.map((userId) => ({
        userId,
        count: customCounts[userId] || 0,
      }))
    }
  }

  const getTotalCustomCount = () => {
    return selectedUsers.reduce((sum, userId) => sum + (customCounts[userId] || 0), 0)
  }

  const handleAssign = async () => {
    const distribution = calculateDistribution()
    
    if (distribution.length === 0) {
      alert('Please select at least one user')
      return
    }

    const totalAssigning = distribution.reduce((sum, d) => sum + d.count, 0)
    if (totalAssigning === 0) {
      alert('Please assign at least one lead')
      return
    }

    if (distributionMode === 'custom' && totalAssigning > assignCount) {
      alert(`Total custom counts (${totalAssigning}) exceeds available leads (${assignCount})`)
      return
    }

    setLoading(true)
    try {
      await onAssign(distribution)
      onOpenChange(false)
    } catch (err: any) {
      alert(`Failed to assign leads: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const distribution = calculateDistribution()
  const totalCustomCount = getTotalCustomCount()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign {assignCount} Leads to Users</DialogTitle>
          <DialogDescription>
            Choose how to distribute the selected leads among users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Assigning {assignCount} leads</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Leads will be assigned from your filtered results</li>
                  <li>• Assignment happens in order (newest first)</li>
                  <li>• You can distribute equally or set custom counts per user</li>
                </ul>
              </div>
            </div>
          </div>

          {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label>Distribution Mode</Label>
                  <RadioGroup value={distributionMode} onValueChange={(v: any) => setDistributionMode(v)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="equal" id="equal" />
                      <Label htmlFor="equal" className="font-normal cursor-pointer">
                        Equal distribution (automatic)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="font-normal cursor-pointer">
                        Custom count per user
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label>Select Users ({selectedUsers.length} selected)</Label>
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {users.map((user) => {
                      const isSelected = selectedUsers.includes(user.id)
                      return (
                        <div
                          key={user.id}
                          className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                              const newCounts = { ...customCounts }
                              delete newCounts[user.id]
                              setCustomCounts(newCounts)
                            } else {
                              setSelectedUsers([...selectedUsers, user.id])
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {user.full_name || user.email}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          {isSelected && distributionMode === 'custom' && (
                            <Input
                              type="number"
                              min={0}
                              max={assignCount}
                              value={customCounts[user.id] || 0}
                              onChange={(e) => {
                                e.stopPropagation()
                                setCustomCounts({
                                  ...customCounts,
                                  [user.id]: parseInt(e.target.value) || 0,
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-24"
                              placeholder="Count"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Distribution Preview
                    </h4>
                    <div className="space-y-2">
                      {distribution.map((d) => {
                        const user = users.find((u) => u.id === d.userId)
                        return (
                          <div key={d.userId} className="flex justify-between text-sm">
                            <span>{user?.full_name || user?.email}</span>
                            <span className="font-medium">{d.count} leads</span>
                          </div>
                        )
                      })}
                      <div className="pt-2 border-t flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span className={totalCustomCount > assignCount ? 'text-red-600' : ''}>
                          {distribution.reduce((sum, d) => sum + d.count, 0)} / {assignCount}
                        </span>
                      </div>
                    </div>
                    {distributionMode === 'custom' && totalCustomCount > assignCount && (
                      <p className="text-xs text-red-600 mt-2">
                        Total exceeds available leads. Please adjust counts.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssign}
                    disabled={loading || selectedUsers.length === 0 || (distributionMode === 'custom' && totalCustomCount > assignCount)}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Assign {assignCount} Leads
                  </Button>
                </div>
              </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
