'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { Loader2, Plus, X } from 'lucide-react'
import type { CustomField } from '@/types/lead'

interface EditFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: CustomField | null
  bucketName: string
  onSuccess: () => void
}

export function EditFieldDialog({ open, onOpenChange, field, bucketName, onSuccess }: EditFieldDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    field_type: 'text',
    is_required: false,
    placeholder: '',
    help_text: '',
    default_value: ''
  })
  const [options, setOptions] = useState<string[]>([''])

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'select', label: 'Dropdown' }
  ]

  // Load field data when dialog opens
  useEffect(() => {
    if (field && open) {
      setFormData({
        name: field.name || '',
        label: field.label || '',
        field_type: field.field_type || 'text',
        is_required: field.is_required || false,
        placeholder: field.placeholder || '',
        help_text: field.help_text || '',
        default_value: field.default_value || ''
      })
      
      // Load options if it's a select field
      if (field.field_type === 'select' && field.options) {
        const opts = Array.isArray(field.options) ? field.options : []
        setOptions(opts.length > 0 ? opts : [''])
      } else {
        setOptions([''])
      }
    }
  }, [field, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!field) return

    setLoading(true)
    setError('')

    try {
      // Prepare field data
      const fieldData: any = {
        name: formData.name,
        label: formData.label,
        field_type: formData.field_type,
        is_required: formData.is_required,
        placeholder: formData.placeholder || null,
        help_text: formData.help_text || null,
        default_value: formData.default_value || null
      }

      // Add options for select fields
      if (formData.field_type === 'select') {
        const validOptions = options.filter(opt => opt.trim() !== '')
        if (validOptions.length === 0) {
          setError('Please add at least one option for dropdown field')
          setLoading(false)
          return
        }
        fieldData.options = validOptions
      } else {
        fieldData.options = null
      }

      const { error: updateError } = await supabase
        .from('custom_fields')
        .update(fieldData)
        .eq('id', field.id)

      if (updateError) throw updateError

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update field')
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  if (!field) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Custom Field</DialogTitle>
            <DialogDescription>
              Update the custom field in the {bucketName} bucket
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Field Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Company Size, Property Type"
                required
              />
              <p className="text-xs text-gray-500">
                This is what users will see
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Internal Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., company_size, property_type"
                required
              />
              <p className="text-xs text-gray-500">
                Used for data storage (cannot be empty)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="field_type">Field Type *</Label>
              <select
                id="field_type"
                value={formData.field_type}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {fieldTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.field_type === 'select' && (
              <div className="grid gap-2">
                <Label>Options *</Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {options.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_required"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_required" className="cursor-pointer">
                Required field
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="placeholder">Placeholder Text</Label>
              <Input
                id="placeholder"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="e.g., Enter company size"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="help_text">Help Text</Label>
              <Textarea
                id="help_text"
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="Additional information to help users fill this field"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="default_value">Default Value</Label>
              <Input
                id="default_value"
                value={formData.default_value}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                placeholder="Optional default value"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Field
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
