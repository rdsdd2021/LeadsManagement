'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, UserPlus, Trash2, Download, Mail, Tag, Archive } from 'lucide-react'

interface BulkActionsMenuProps {
  selectedCount: number
  onAssign: () => void
  onDelete: () => void
  onExport?: () => void
  onEmail?: () => void
  onTag?: () => void
  onArchive?: () => void
  disabled?: boolean
}

export function BulkActionsMenu({
  selectedCount,
  onAssign,
  onDelete,
  onExport,
  onEmail,
  onTag,
  onArchive,
  disabled = false,
}: BulkActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled || selectedCount === 0}>
          Bulk Actions ({selectedCount})
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          Actions for {selectedCount} lead{selectedCount !== 1 ? 's' : ''}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Primary Actions */}
        <DropdownMenuItem onClick={onAssign}>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign to Users
        </DropdownMenuItem>
        
        {onExport && (
          <DropdownMenuItem onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </DropdownMenuItem>
        )}
        
        {onEmail && (
          <DropdownMenuItem onClick={onEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
        )}
        
        {onTag && (
          <DropdownMenuItem onClick={onTag}>
            <Tag className="mr-2 h-4 w-4" />
            Add Tags
          </DropdownMenuItem>
        )}
        
        {onArchive && (
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Destructive Actions */}
        <DropdownMenuItem 
          onClick={onDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
