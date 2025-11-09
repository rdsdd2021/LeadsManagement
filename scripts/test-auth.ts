import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('🔍 Testing Authentication System...\n')

  // Test 1: Check if we can connect to Supabase
  console.log('1️⃣ Testing Supabase connection...')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    console.error('❌ Session error:', sessionError.message)
  } else {
    console.log('✅ Supabase connection successful')
    if (session) {
      console.log('   Current session:', session.user.email)
    } else {
      console.log('   No active session')
    }
  }

  // Test 2: Try to sign in with existing credentials
  console.log('\n2️⃣ Testing sign in with existing user...')
  const testEmail = 'rds2197@gmail.com'
  const testPassword = 'B@ssDr0p'
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })

  if (signInError) {
    console.log('⚠️  Sign in failed:', signInError.message)
    console.log('   This is expected if the user doesn\'t exist yet')
  } else {
    console.log('✅ Sign in successful!')
    console.log('   User ID:', signInData.user.id)
    console.log('   Email:', signInData.user.email)
    console.log('   Metadata:', signInData.user.user_metadata)
  }

  // Test 3: Check users table
  console.log('\n3️⃣ Checking users table...')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(5)

  if (usersError) {
    console.log('⚠️  Users table error:', usersError.message)
    console.log('   You may need to run the migration first')
  } else {
    console.log('✅ Users table accessible')
    console.log('   Total users found:', users?.length || 0)
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`)
      })
    }
  }

  // Test 4: Check leads table access
  console.log('\n4️⃣ Testing leads table access...')
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('count')
    .limit(1)

  if (leadsError) {
    console.log('⚠️  Leads table error:', leadsError.message)
  } else {
    console.log('✅ Leads table accessible')
  }

  console.log('\n✨ Test complete!')
}

testAuth().catch(console.error)
