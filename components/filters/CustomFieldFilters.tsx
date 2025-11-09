'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FilterSection } from './FilterSection'
import { Separator } from '@/components/ui/separator'
import { useFilterStore } from '@/stores/filterStore'
import { useFilterValueCounts } from '@/hooks/useFilterValueCounts'
import { Loader2 } from 'lucide-react'

interface CustomField {
  id: string
  name: string
  label: string
  field_type: string
  options: string[] | null
  bucket_id: string
}

interface FieldUniqueValues {
  [fieldName: string]: string[]
}

export function CustomFieldFilters() {
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [uniqueValues, setUniqueValues] = useState<FieldUniqueValues>({})
  const [loading, setLoading] = useState(true)
  const [loadingValues, setLoadingValues] = useState(false)
  const { customFilters, setCustomFilter } = useFilterStore()
  const { data: filterCounts } = useFilterValueCounts()

  useEffect(() => {
    loadCustomFieldsAndValues()
  }, [])

  const loadCustomFieldsAndValues = async () => {
    setLoading(true)
    try {
      // Load custom fields with increased timeout
      const { data, error } = await supabase
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

      if (error) {
        console.error('⚠️ Error loading custom fields:', error)
        return
      }

      if (data) {
        setCustomFields(data as any)
        
        // Load unique values for fields that don't have predefined options
        await loadUniqueValuesForFields(data as any)
      }
    } catch (err) {
      console.error('❌ Custom fields load failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadUniqueValuesForFields = async (fields: CustomField[]) => {
    setLoadingValues(true)
    try {
      const valuesMap: FieldUniqueValues = {}
      
      // For fields with predefined options, use those
      fields.forEach(field => {
        if (field.field_type === 'select' && field.options) {
          valuesMap[field.name] = field.options
        } else if (field.field_type === 'boolean') {
          valuesMap[field.name] = ['Yes', 'No']
        }
      })

      setUniqueValues(valuesMap)
    } catch (err) {
      console.error('❌ Failed to load unique values:', err)
    } finally {
      setLoadingValues(false)
    }
  }

  // Get options for a field
  const getFieldOptions = (field: CustomField): string[] => {
    // Use predefined options if available
    if (field.field_type === 'select' && field.options) {
      return field.options
    }
    
    // Use boolean options
    if (field.field_type === 'boolean') {
      return ['Yes', 'No']
    }
    
    // Use dynamic values from API counts
    if (filterCounts?.customFields?.[field.name]) {
      return Object.keys(filterCounts.customFields[field.name]).sort()
    }
    
    // Fallback to extracted unique values
    return uniqueValues[field.name] || []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (customFields.length === 0) {
    return null // Don't show anything if no custom fields are defined
  }

  return (
    <>
      <Separator />
      {customFields.map((field, index) => {
        const options = getFieldOptions(field)
        
        // Only show fields that have options
        if (options.length === 0) {
          return null
        }

        return (
          <div key={field.id}>
            {index > 0 && <Separator />}
            <FilterSection
              title={field.label}
              options={options}
              selectedValues={customFilters[field.name] ? [customFilters[field.name]] : []}
              onChange={(values) => {
                if (values.length > 0) {
                  setCustomFilter(field.name, values[0])
                } else {
                  setCustomFilter(field.name, null)
                }
              }}
              isLoading={loadingValues}
              counts={filterCounts?.customFields?.[field.name] || {}}
            />
          </div>
        )
      })}
    </>
  )
}
