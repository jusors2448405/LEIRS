import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kyvhyhmqwcxbloiliojw.supabase.co'
const supabaseAnonKey = 'sb_publishable_17FzwGTxf5fon1MFiTNtUA_COCWk1P6'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function investigateDuplicates() {
  console.log('='.repeat(80))
  console.log('LEIRS REVISE — DUPLICATE USERS INVESTIGATION')
  console.log('='.repeat(80))
  console.log('')

  // 1. Query Supabase Auth users
  console.log('1. SUPABASE AUTH USERS')
  console.log('-'.repeat(80))
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.log('   ⚠️  Cannot query auth.users (requires service role key)')
    console.log('   Error:', authError.message)
  } else {
    console.log(`   Total Auth Users: ${authData.users.length}`)
    authData.users.forEach(user => {
      console.log(`   - ${user.email} (UUID: ${user.id})`)
    })
  }
  console.log('')

  // 2. Query public.profiles table
  console.log('2. PUBLIC.PROFILES TABLE')
  console.log('-'.repeat(80))
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('email')

  if (profilesError) {
    console.log('   ❌ Error querying profiles:', profilesError.message)
  } else {
    console.log(`   Total Profiles: ${profiles.length}`)
    profiles.forEach(profile => {
      console.log(`   - ${profile.email} | Role: ${profile.role} | ID: ${profile.id}`)
    })
  }
  console.log('')

  // 3. Check for duplicate profiles with the same auth UUID
  console.log('3. DUPLICATE PROFILE CHECK (Same Auth UUID)')
  console.log('-'.repeat(80))
  if (profiles && profiles.length > 0) {
    const uuidCount = {}
    profiles.forEach(p => {
      uuidCount[p.id] = (uuidCount[p.id] || 0) + 1
    })
    
    const duplicateUUIDs = Object.keys(uuidCount).filter(uuid => uuidCount[uuid] > 1)
    if (duplicateUUIDs.length > 0) {
      console.log(`   ⚠️  Found ${duplicateUUIDs.length} UUID(s) with multiple profiles:`)
      duplicateUUIDs.forEach(uuid => {
        console.log(`   - UUID ${uuid}: ${uuidCount[uuid]} profiles`)
        const dupes = profiles.filter(p => p.id === uuid)
        dupes.forEach(d => console.log(`     → ${d.email} (role: ${d.role})`))
      })
    } else {
      console.log('   ✅ No duplicate profiles for the same auth UUID')
    }
  }
  console.log('')

  // 4. Check for duplicate emails in profiles
  console.log('4. DUPLICATE EMAIL CHECK (Multiple Profiles, Same Email)')
  console.log('-'.repeat(80))
  if (profiles && profiles.length > 0) {
    const emailCount = {}
    profiles.forEach(p => {
      const email = p.email.toLowerCase()
      emailCount[email] = (emailCount[email] || 0) + 1
    })
    
    const duplicateEmails = Object.keys(emailCount).filter(email => emailCount[email] > 1)
    if (duplicateEmails.length > 0) {
      console.log(`   ⚠️  Found ${duplicateEmails.length} email(s) with multiple profiles:`)
      duplicateEmails.forEach(email => {
        console.log(`   - ${email}: ${emailCount[email]} profiles`)
        const dupes = profiles.filter(p => p.email.toLowerCase() === email)
        dupes.forEach(d => console.log(`     → Profile ID: ${d.id}, Role: ${d.role}`))
      })
    } else {
      console.log('   ✅ No duplicate emails in profiles table')
    }
  }
  console.log('')

  // 5. Check localStorage users
  console.log('5. LOCALSTORAGE USERS (Frontend Only)')
  console.log('-'.repeat(80))
  console.log('   ℹ️  Cannot check localStorage from Node.js')
  console.log('   This data exists only in the browser')
  console.log('   Check browser DevTools → Application → Local Storage → leirs_users')
  console.log('')

  // 6. Summary
  console.log('6. SUMMARY')
  console.log('-'.repeat(80))
  console.log('   Profiles in database:', profiles ? profiles.length : 'N/A')
  console.log('')
  console.log('INVESTIGATION NOTES:')
  console.log('- If duplicates appear ONLY in the UI but NOT in Supabase:')
  console.log('  → Problem is in frontend query/display logic')
  console.log('  → Check Users.jsx getUsers() function')
  console.log('')
  console.log('- If duplicates exist in Supabase profiles:')
  console.log('  → Database cleanup required')
  console.log('  → Need to delete duplicate profile records')
  console.log('')
  console.log('- If localStorage contains extra users:')
  console.log('  → Frontend is mixing localStorage + Supabase data')
  console.log('  → Need to update Users.jsx to use ONLY Supabase')
  console.log('')
  console.log('='.repeat(80))
  console.log('DUPLICATE USER INVESTIGATION COMPLETE — WAITING FOR CLEANUP APPROVAL')
  console.log('='.repeat(80))
}

investigateDuplicates()
