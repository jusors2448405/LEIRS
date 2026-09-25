/**
 * LEIRS - Insert Profile for New Auth User
 * Usage: node insert-admin-profile.js <AUTH_UUID>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read .env file
const envPath = join(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')
const envLines = envContent.split('\n')

let supabaseUrl, supabaseAnonKey
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim()
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim()
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const authUUID = process.argv[2]

if (!authUUID) {
  console.error('❌ ERROR: Auth UUID required')
  console.log('\nUsage: node insert-admin-profile.js <AUTH_UUID>')
  console.log('\nTo get the Auth UUID:')
  console.log('1. Go to Supabase Dashboard → Authentication → Users')
  console.log('2. Find: leirs.admin@gmail.com')
  console.log('3. Copy the UUID')
  console.log('4. Run: node scripts/insert-admin-profile.js <UUID>\n')
  process.exit(1)
}

async function insertProfile() {
  console.log('========================================')
  console.log('LEIRS: Insert New Admin Profile')
  console.log('========================================\n')

  const newEmail = 'leirs.admin@gmail.com'
  const oldEmail = 'sysadmin@leirs.com'

  try {
    console.log('Auth UUID:', authUUID)
    console.log('Email:', newEmail)
    console.log()

    // Check if profile already exists
    console.log('Checking for existing profile...')
    const { data: existing, error: checkErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUUID)
      .maybeSingle()

    if (checkErr && checkErr.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', checkErr.message)
      process.exit(1)
    }

    if (existing) {
      console.log('✅ Profile already exists!')
      console.log('   ID:', existing.id)
      console.log('   Email:', existing.email)
      console.log('   Full Name:', existing.full_name)
      console.log('   Role:', existing.role)
      console.log('   Status:', existing.status)
      console.log('\n✅ No insertion needed.\n')
      return
    }

    console.log('✅ No existing profile - proceeding with insert\n')

    // Insert new profile
    console.log('Inserting new profile...')
    const { data: newProfile, error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: authUUID,
        email: newEmail,
        full_name: 'LEIRS Administrator',
        role: 'system_admin',
        status: 'Active'
      })
      .select()
      .single()

    if (insertErr) {
      console.error('❌ INSERT FAILED:', insertErr.message)
      console.error('   Code:', insertErr.code)
      console.error('   Details:', insertErr.details || 'None')
      console.error('\n⚠️  STOPPED - No destructive changes attempted.\n')
      process.exit(1)
    }

    console.log('✅ Profile inserted successfully!\n')

    // Verify new profile
    console.log('Verifying new profile...')
    const { data: verifyNew, error: verifyErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('email', newEmail)
      .single()

    if (verifyErr) {
      console.error('❌ Verification failed:', verifyErr.message)
      process.exit(1)
    }

    console.log('✅ New profile confirmed:')
    console.log('   ID:', verifyNew.id)
    console.log('   Email:', verifyNew.email)
    console.log('   Full Name:', verifyNew.full_name)
    console.log('   Role:', verifyNew.role)
    console.log('   Status:', verifyNew.status)
    console.log()

    // Verify old profile unchanged
    console.log('Verifying old profile unchanged...')
    const { data: verifyOld, error: oldErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('email', oldEmail)
      .single()

    if (oldErr) {
      console.error('❌ Old profile verification failed:', oldErr.message)
      process.exit(1)
    }

    console.log('✅ Old profile unchanged:')
    console.log('   ID:', verifyOld.id)
    console.log('   Email:', verifyOld.email)
    console.log('   Full Name:', verifyOld.full_name)
    console.log('   Role:', verifyOld.role)
    console.log('   Status:', verifyOld.status)
    console.log()

    // Final summary
    console.log('========================================')
    console.log('✅ SUCCESS: DATABASE CHANGE COMPLETE')
    console.log('========================================\n')

    console.log('NEW PROFILE:')
    console.log('  Auth UID:', verifyNew.id)
    console.log('  Email:', verifyNew.email)
    console.log('  Full Name:', verifyNew.full_name)
    console.log('  Role:', verifyNew.role)
    console.log('  Status:', verifyNew.status)
    console.log()

    console.log('OLD PROFILE (UNCHANGED):')
    console.log('  Email:', verifyOld.email)
    console.log('  Role:', verifyOld.role)
    console.log('  Status:', verifyOld.status)
    console.log()

    console.log('✅ Both system_admin accounts are now active.')
    console.log('✅ Old sysadmin@leirs.com remains untouched.')
    console.log('✅ Database change complete.\n')

  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err.message)
    console.error(err)
    process.exit(1)
  }
}

insertProfile()
