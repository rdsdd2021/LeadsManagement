// Lead type definitions

export interface Lead {
  // System fields
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  bucket_id: string | null
  
  // User-uploaded mandatory fields (from CSV)
  name: string
  phone: string | null
  school: string | null
  district: string | null
  gender: string | null
  stream: string | null
  
  // User-uploaded custom fields (from CSV, bucket-specific)
  custom_fields: Record<string, any>
  
  // Assignment fields (set by admin/manager)
  assigned_to: string | null
  assignment_date: string | null
}

export interface LeadBucket {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CustomField {
  id: string
  bucket_id: string
  name: string
  label: string
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea' | 'email' | 'phone' | 'url'
  options: string[] | null
  is_required: boolean
  default_value: string | null
  placeholder: string | null
  help_text: string | null
  validation_rules: Record<string, any> | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface BucketWithFields {
  bucket: LeadBucket
  fields: CustomField[]
}

export interface CSVMapping {
  csvColumn: string
  leadField: string
  isCustomField: boolean
  customFieldId?: string
  transform?: (value: any) => any
}

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}
