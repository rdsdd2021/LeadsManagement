import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseServerInstance: SupabaseClient | null = null

// Server-side client with service role (bypasses RLS)
// Using lazy initialization to avoid build-time errors
export function getSupabaseServer() {
  if (supabaseServerInstance) {
    return supabaseServerInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseServerInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return supabaseServerInstance
}

// For backward compatibility
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseServer()[prop as keyof SupabaseClient]
  }
})
