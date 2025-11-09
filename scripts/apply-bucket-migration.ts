import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('📦 Applying bucket migration...')
  
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '006_lead_buckets_and_templates.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`Found ${statements.length} SQL statements`)
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (statement.length > 0) {
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`)
      console.log(statement.substring(0, 100) + '...')
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error)
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
  }
  
  console.log('\n✅ Migration complete!')
}

applyMigration().catch(console.error)
