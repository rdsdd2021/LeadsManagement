'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FilterSection } from './FilterSection'
import { Separator } from '@/components/ui/separator'
import { useFilterStore } from '@/stores/filterStore'
import { Loader2 } from 'lucide-react'

interface CustomField {
  id: string
  name: string
  label: string
  field_type: string
  options: string[] | null
  bucket_id: string
}

export function CustomFieldFilters() {
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const { customFilters, setCustomFilter } = useFilterStore()

  useEffect(() => {
    loadCustomFields()
  }, [])

  const loadCustomFields = async () => {
    setLoading(true)
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Custom fields load timeout')), 3000)
      })

      const queryPromise = supabase
        .from('custom_fields')
        .select(`
          id,
          name,
          label,
          field_type,
          options,
          bucket_id,
          lead_buckets!inner(is_active)
        `)
        .eq('lead_buckets.is_active', true)
        .order('label')

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      if (!error && data) {
        setCustomFields(data as any)
      } else if (error) {
        console.error('⚠️ Error loading custom fields:', error)
      }
    } catch (err) {
      console.error('❌ Custom fields load failed:', err)
      // Continue without custom fields
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (customFields.length === 0) {
    return null
  }

  // Group fields by type for better rendering
  const selectFields = customFields.filter(f => f.field_type === 'select' && f.options)
  const booleanFields = customFields.filter(f => f.field_type === 'boolean')

  return (
    <>
      {selectFields.map((field, index) => (
        <div key={field.id}>
          {index > 0 && <Separator />}
          <FilterSection
            title={field.label}
            options={field.options || []}
            selectedValues={customFilters[field.name] ? [customFilters[field.name]] : []}
            onChange={(values) => {
              if (values.length > 0) {
                setCustomFilter(field.name, values[0])
              } else {
                setCustomFilter(field.name, null)
              }
            }}
            isLoading={false}
          />
        </div>
      ))}

      {booleanFields.map((field, index) => (
        <div key={field.id}>
          {(index > 0 || selectFields.length > 0) && <Separator />}
          <FilterSection
            title={field.label}
            options={['Yes', 'No']}
            selectedValues={customFilters[field.name] ? [customFilters[field.name]] : []}
            onChange={(values) => {
              if (values.length > 0) {
                setCustomFilter(field.name, values[0])
              } else {
                setCustomFilter(field.name, null)
              }
            }}
            isLoading={false}
          />
        </div>
      ))}
    </>
  )
}
