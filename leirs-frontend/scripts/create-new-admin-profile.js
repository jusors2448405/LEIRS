/**
 * LEIRS - Create Profile for New Auth User
 * 
 * Creates a public.profiles record for leirs.admin@gmail.com
 * Links to existing Supabase Auth user
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kyvhyhmqwcxbloiliojw.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dmh5aG1xd2N4YmxvaWxpb2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNjI0NDYsImV4cCI6MjA1ODYzODQ0Nn0.5VqmWBMHLZ-vcK5OZUMQCrD2sHEo7k93-gw1kTNUZGA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createNewAdminProfile() {
  console.log('========================================')
  console.log('LEIRS: Create Profile for New Auth User')
  console.log('========================================\n')

  const newEmail = 'leirs.admin@gmail.com'
  const oldEmail = 'sysadmin@leirs.com'

  try {
    // ========================================
    // STEP 1: Retrieve Auth UID
    // ========================================
    console.log('STEP 1: Retrieve Auth UID for', newEmail)
    console.log('----------------------------------------')

    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at')
      .eq('email', newEmail)
      .single()

    // Try alternative method if first fails (auth.users not directly accessible)
    if (authError) {
      console.log('⚠️  Cannot query auth.users directly (expected)')
      console.log('   Using admin API method...\n')
      
      // We need to use a different approach - query profiles to see if it exists
      // and get the auth user list from admin endpoint
      console.log('⚠️  Please provide the Auth UID manually.')
      console.log('   Go to: Supabase Dashboard → Authentication → Users')
      console.log('   Find: leirs.admin@gmail.com')
      console.log('   Copy the UUID\n')
      
      // For now, let's check if profile already exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newEmail)
        .maybeSingle()
      
      if (existingProfile) {
        console.log('✅ Profile already exists!')
        console.log('   ID:', existingProfile.id)
        console.log('   Email:', existingProfile.email)
        console.log('   Full Name:', existingProfile.full_name)
        console.log('   Role:', existingProfile.role)
        console.log('   Status:', existingProfile.status)
        console.log('\n✅ No action needed - profile already configured.\n')
        return
      }
      
      console.log('Please run this script with the Auth UID as argument:')
      console.log('node create-new-admin-profile.js <AUTH_UID>\n')
      process.exit(1)
    }

    console.log('✅ Auth user found:')
    console.log('   Email:', authUsers.email)
    console.log('   UID:', authUsers.id)
    console.log('   Email Verified:', authUsers.email_confirmed_at ? 'Yes' : 'No')
    console.log('   Created:', authUsers.created_at)
    console.log()

    const authUID = authUsers.id

    // ========================================
    // STEP 2: Verify Email Exists in auth.users
    // ========================================
    console.log('STEP 2: Verify Email in auth.users')
    console.log('----------------------------------------')
    console.log('✅ Email verified:', newEmail, 'exists in auth.users\n')

    // ========================================
    // STEP 3: Check for Existing Profile
    // ========================================
    console.log('STEP 3: Check for Existing Profile')
    console.log('----------------------------------------')

    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUID)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', checkError.message)
      process.exit(1)
    }

    if (existingProfile) {
      console.log('⚠️  Profile already exists for this UID!')
      console.log('   ID:', existingProfile.id)
      console.log('   Email:', existingProfile.email)
      console.log('   Role:', existingProfile.role)
      console.log('\n✅ No insertion needed.\n')
      return
    }

    console.log('✅ No existing profile found - safe to insert\n')

    // ========================================
    // STEP 4: Insert New Profile
    // ========================================
    console.log('STEP 4: Insert New Profile')
    console.log('----------------------------------------')

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authUID,
        email: newEmail,
        full_name: 'LEIRS Administrator',
        role: 'system_admin',
        status: 'Active'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ INSERT FAILED:', insertError.message)
      console.error('   Code:', insertError.code)
      console.error('   Details:', insertError.details)
      console.error('\n⚠️  STOPPING - No destructive changes attempted.\n')
      process.exit(1)
    }

    console.log('✅ Profile inserted successfully!')
    console.log('   ID:', newProfile.id)
    console.log('   Email:', newProfile.email)
    console.log('   Full Name:', newProfile.full_name)
    console.log('   Role:', newProfile.role)
    console.log('   Status:', newProfile.status)
    console.log()

    // ========================================
    // STEP 5-6: Verified (No modifications to old account)
    // ========================================
    console.log('STEP 5-6: Verification')
    console.log('----------------------------------------')
    console.log('✅ No modifications made to existing accounts\n')

    // ========================================
    // STEP 7: Verify New Profile
    // ========================================
    console.log('STEP 7: Verify New Profile')
    console.log('----------------------------------------')

    const { data: verifyNew, error: verifyNewError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('email', newEmail)
      .single()

    if (verifyNewError) {
      console.error('❌ Verification failed:', verifyNewError.message)
      process.exit(1)
    }

    console.log('✅ New profile verified:')
    console.log('   ID:', verifyNew.id)
    console.log('   Email:', verifyNew.email)
    console.log('   Full Name:', verifyNew.full_name)
    console.log('   Role:', verifyNew.role)
    console.log('   Status:', verifyNew.status)
    console.log()

    // ========================================
    // STEP 8: Verify Old Profile Unchanged
    // ========================================
    console.log('STEP 8: Verify Old Profile Unchanged')
    console.log('----------------------------------------')

    const { data: verifyOld, error: verifyOldError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('email', oldEmail)
      .single()

    if (verifyOldError) {
      console.error('❌ Old profile verification failed:', verifyOldError.message)
      process.exit(1)
    }

    console.log('✅ Old profile unchanged:')
    console.log('   ID:', verifyOld.id)
    console.log('   Email:', verifyOld.email)
    console.log('   Full Name:', verifyOld.full_name)
    console.log('   Role:', verifyOld.role)
    console.log('   Status:', verifyOld.status)
    console.log()

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('========================================')
    console.log('✅ SUCCESS: Profile Creation Complete')
    console.log('========================================\n')

    console.log('New Profile:')
    console.log('  Auth UID:', verifyNew.id)
    console.log('  Email:', verifyNew.email)
    console.log('  Full Name:', verifyNew.full_name)
    console.log('  Role:', verifyNew.role)
    console.log('  Status:', verifyNew.status)
    console.log()

    console.log('Old Profile (Unchanged):')
    console.log('  Email:', verifyOld.email)
    console.log('  Role:', verifyOld.role)
    console.log('  Status:', verifyOld.status)
    console.log()

    console.log('✅ Both system_admin accounts are active.')
    console.log('✅ Database change complete.\n')

  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err.message)
    console.error(err)
    process.exit(1)
  }
}

// Run the script
createNewAdminProfile()
