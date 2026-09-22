/**
 * LEIRS Password Reset Script
 * 
 * Uses Supabase Service Role Key (admin access) to reset passwords
 * Run once to set all 6 admin account passwords
 * 
 * IMPORTANT: Keep this file secure - contains service role key
 */

import { createClient } from '@supabase/supabase-js'

// Supabase credentials
const SUPABASE_URL = 'https://kyvhyhmqwcxbloiliojw.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE' // Replace with actual key

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Accounts to reset
const accounts = [
  { email: 'sysadmin@leirs.com', password: 'sysadmin123' },
  { email: 'incident@leirs.com', password: 'incident123' },
  { email: 'caseadmin@leirs.com', password: 'case123' },
  { email: 'dispatch@leirs.com', password: 'dispatch123' },
  { email: 'evidence@leirs.com', password: 'evidence123' },
  { email: 'status@leirs.com', password: 'status123' }
]

async function resetPasswords() {
  console.log('='.repeat(60))
  console.log('LEIRS Password Reset Script')
  console.log('='.repeat(60))
  console.log()

  for (const account of accounts) {
    try {
      // Get user by email
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.error(`❌ Error listing users:`, listError.message)
        continue
      }

      const user = users.find(u => u.email === account.email)

      if (!user) {
        console.log(`⚠️  User not found: ${account.email}`)
        continue
      }

      // Update user password
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: account.password }
      )

      if (error) {
        console.error(`❌ Failed to reset ${account.email}:`, error.message)
      } else {
        console.log(`✅ Password reset: ${account.email}`)
      }

    } catch (err) {
      console.error(`❌ Unexpected error for ${account.email}:`, err.message)
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log('Password reset complete!')
  console.log('='.repeat(60))
  console.log()
  console.log('Next steps:')
  console.log('1. Test login: sysadmin@leirs.com / sysadmin123')
  console.log('2. If successful, test the other 5 accounts')
  console.log('3. Delete this script for security')
}

// Run the script
resetPasswords()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
