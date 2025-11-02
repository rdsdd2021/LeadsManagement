import { supabase } from './supabase'

export async function signInAsAdmin() {
  // In a real app, you'd have a login form
  // For now, we'll create a test user
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'rds2197@gmail.com', // Change this to your test email
    password: 'B@ssDr0p', // Change this
  })

  if (error) {
    console.error('❌ Sign in error:', error)
    return null
  }

  console.log('✅ Signed in as:', data.user.email)
  return data.user
}

export async function signOut() {
  await supabase.auth.signOut()
  console.log('🚪 Signed out')
}