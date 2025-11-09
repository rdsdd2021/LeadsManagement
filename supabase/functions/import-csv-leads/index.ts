import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ColumnMapping {
  csvColumn: string
  leadField: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { jobId, columnMappings } = await req.json()

    console.log(`Processing import job: ${jobId}`)
    console.log(`Column mappings:`, columnMappings)

    // Get job details
    const { data: job, error: jobError } = await supabaseClient
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new Error('Job not found')
    }

    // Update status to processing
    await supabaseClient
      .from('import_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('csv-imports')
      .download(job.file_path)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Parse CSV properly handling quoted values
    const csvText = await fileData.text()
    const lines = csvText.split('\n').filter((line: string) => line.trim())
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    // Helper function to parse CSV line properly (handles quoted values with commas)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"'
            i++ // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      // Add last field
      result.push(current.trim())
      
      return result
    }

    // Parse headers
    const headers = parseCSVLine(lines[0])
    
    console.log(`CSV headers:`, headers)

    // Create mapping object for quick lookup
    const mappingObj: Record<string, string> = {}
    if (columnMappings && Array.isArray(columnMappings)) {
      columnMappings.forEach((mapping: ColumnMapping) => {
        if (mapping.leadField) {
          mappingObj[mapping.csvColumn] = mapping.leadField
        }
      })
    }

    console.log(`Mapping object:`, mappingObj)

    // Validate required fields are mapped
    const requiredFields = ['Name', 'Phone Number', 'School', 'District', 'Gender', 'Stream']
    const mappedFields = Object.values(mappingObj)
    const missingFields = requiredFields.filter(f => !mappedFields.includes(f))
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required field mappings: ${missingFields.join(', ')}`)
    }

    // Parse data rows
    const records: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: any = {}
      headers.forEach((header: string, idx: number) => {
        row[header] = values[idx] || ''
      })
      records.push(row)
    }

    console.log(`Parsed ${records.length} records`)

    // Update total rows
    await supabaseClient
      .from('import_jobs')
      .update({ total_rows: records.length })
      .eq('id', jobId)

    // Get custom fields for the bucket
    const { data: customFields } = await supabaseClient
      .from('custom_fields')
      .select('name, label')
      .eq('bucket_id', job.bucket_id)

    const customFieldMap = new Map(
      customFields?.map((f: any) => [f.label, f.name]) || []
    )

    console.log(`Custom fields:`, Array.from(customFieldMap.entries()))

    // Process in batches
    const BATCH_SIZE = 100
    let successCount = 0
    let failedCount = 0
    const errors: any[] = []

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, Math.min(i + BATCH_SIZE, records.length))
      
      // Transform records to lead objects using mappings
      const leads = batch.map((row: any, batchIndex: number) => {
        try {
          const customFieldsData: Record<string, any> = {}
          
          // Map all columns according to mappings
          const leadData: any = {
            bucket_id: job.bucket_id,
            created_by: user.id
          }

          Object.keys(row).forEach((csvColumn: string) => {
            const leadField = mappingObj[csvColumn]
            
            if (leadField) {
              // Check if it's a required field
              if (requiredFields.includes(leadField)) {
                // Map to lead table column with explicit mapping
                switch (leadField) {
                  case 'Name':
                    leadData.name = row[csvColumn]
                    break
                  case 'Phone Number':
                    leadData.phone = row[csvColumn]
                    break
                  case 'School':
                    leadData.school = row[csvColumn]
                    break
                  case 'District':
                    leadData.district = row[csvColumn]
                    break
                  case 'Gender':
                    leadData.gender = row[csvColumn]
                    break
                  case 'Stream':
                    leadData.stream = row[csvColumn]
                    break
                  default:
                    console.warn(`Unknown required field: ${leadField}`)
                }
              } else {
                // It's a custom field
                const customFieldName = customFieldMap.get(leadField)
                if (customFieldName) {
                  customFieldsData[customFieldName] = row[csvColumn]
                }
              }
            }
          })

          leadData.custom_fields = customFieldsData

          return leadData
        } catch (err: any) {
          errors.push({
            row: i + batchIndex + 2, // +2 for header and 0-index
            error: err.message
          })
          failedCount++
          return null
        }
      }).filter((lead: any) => lead !== null)

      // Insert batch
      if (leads.length > 0) {
        const { data: insertedLeads, error: insertError } = await supabaseClient
          .from('leads')
          .insert(leads)
          .select('id')

        if (insertError) {
          console.error(`Batch insert error:`, insertError)
          // Record errors for this batch
          batch.forEach((_, batchIndex: number) => {
            errors.push({
              row: i + batchIndex + 2,
              error: insertError.message
            })
            failedCount++
          })
        } else {
          successCount += insertedLeads?.length || leads.length
        }
      }

      // Update progress
      await supabaseClient
        .from('import_jobs')
        .update({
          processed_rows: Math.min(i + BATCH_SIZE, records.length),
          success_count: successCount,
          failed_count: failedCount,
          errors: errors.slice(0, 100) // Keep only first 100 errors
        })
        .eq('id', jobId)

      console.log(`Processed batch ${i / BATCH_SIZE + 1}: ${successCount} success, ${failedCount} failed`)

      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < records.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Mark as completed
    await supabaseClient
      .from('import_jobs')
      .update({
        status: errors.length === records.length ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        processed_rows: records.length,
        success_count: successCount,
        failed_count: failedCount
      })
      .eq('id', jobId)

    // Clean up file from storage after successful processing
    if (successCount > 0) {
      await supabaseClient.storage
        .from('csv-imports')
        .remove([job.file_path])
    }

    console.log(`Import completed: ${successCount} success, ${failedCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        totalRows: records.length,
        successCount,
        failedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('Import error:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
