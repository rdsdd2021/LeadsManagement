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
      console.log('🔍 Loading custom fields...')
      
      // Simplified query - just get custom fields without join
      const { data, error } = await supabase
        .from('custom_fields')
        .select('id, name, label, field_type, options, bucket_id')
        .order('label')

      if (error) {
        console.error('⚠️ Error loading custom fields:', error)
        setLoading(false)
        return
      }

      console.log('✅ Custom fields loaded:', data?.length || 0)

      if (data && data.length > 0) {
        setCustomFields(data as any)
        
        // Load unique values for fields that don't have predefined options
        await loadUniqueValuesForFields(data as any)
      } else {
        console.log('ℹ️ No custom fields found')
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
    console.log(`🔍 Getting options for field: ${field.name}`, {
      fieldType: field.field_type,
      predefinedOptions: field.options,
      filterCountsForField: filterCounts?.customFields?.[field.name],
      uniqueValuesForField: uniqueValues[field.name]
    })
    
    // Use predefined options if available
    if (field.field_type === 'select' && field.options) {
      console.log(`✅ Using predefined options for ${field.name}:`, field.options)
      return field.options
    }
    
    // Use boolean options
    if (field.field_type === 'boolean') {
      console.log(`✅ Using boolean options for ${field.name}`)
      return ['Yes', 'No']
    }
    
    // Use dynamic values from API counts
    if (filterCounts?.customFields?.[field.name]) {
      const options = Object.keys(filterCounts.customFields[field.name]).sort()
      console.log(`✅ Using filter counts for ${field.name}:`, options)
      return options
    }
    
    // Fallback to extracted unique values
    const fallback = uniqueValues[field.name] || []
    console.log(`⚠️ Using fallback for ${field.name}:`, fallback)
    return fallback
  }

  if (loading) {
    return (
      <>
        <Separator />
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-muted-foreground">Loading custom fields...</span>
        </div>
      </>
    )
  }

  if (customFields.length === 0) {
    console.log('ℹ️ No custom fields to display')
    return null // Don't show anything if no custom fields are defined
  }

  console.log('📋 Rendering custom fields:', customFields.length)

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
