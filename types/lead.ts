// Lead type definitions

export interface Lead {
  id: string
  status: string
  category: string
  region: string | null
  name: string
  phone: string | null
  email: string | null
  value: number
  priority: number
  assigned_to: string | null
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
  created_by: string | null
  team: string | null
}

export interface CustomField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  options?: string[]
  required: boolean
  created_at: string
  created_by: string
}

export interface CSVMapping {
  csvColumn: string
  leadField: string
  isCustomField: boolean
  transform?: (value: any) => any
}

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}
