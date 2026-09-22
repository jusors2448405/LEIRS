/**
 * Check and Delete Test Police Station Charlie
 * 
 * Step 1: Check for foreign key references
 * Step 2: Delete if safe, or report issues
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8')
const envLines = envContent.split('\n')
const SUPABASE_URL = envLines.find(line => line.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]
const SUPABASE_ANON_KEY = envLines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('╔═══════════════════════════════════════════════════════════════════╗')
console.log('║   TEST POLICE STATION CHARLIE - DELETION CHECK                    ║')
console.log('╚═══════════════════════════════════════════════════════════════════╝\n')

async function checkAndDelete() {
  try {
    // Step 1: Get Test Police Station Charlie details
    console.log('📋 Step 1: Locating Test Police Station Charlie...\n')
    
    const { data: charlie, error: fetchError } = await supabase
      .from('police_stations')
      .select('*')
      .eq('station_name', 'Test Police Station Charlie')
      .single()
    
    if (fetchError || !charlie) {
      console.log('❓ Test Police Station Charlie not found in database.')
      console.log('   It may have already been deleted.\n')
      
      // Show current stations
      const { data: currentStations } = await supabase
        .from('police_stations')
        .select('station_name, address')
        .order('station_name')
      
      console.log('Current police stations:')
      currentStations.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.station_name}`)
      })
      return
    }
    
    console.log('✅ Found: Test Police Station Charlie')
    console.log(`   ID: ${charlie.id}`)
    console.log(`   Address: ${charlie.address}`)
    console.log(`   Coordinates: ${charlie.latitude}, ${charlie.longitude}\n`)
    
    // Step 2: Check for dispatch records referencing this station
    console.log('🔍 Step 2: Checking for foreign key references...\n')
    
    const { data: dispatchRecords, error: dispatchError } = await supabase
      .from('dispatch')
      .select('id, dispatch_status, created_at')
      .eq('police_station_id', charlie.id)
    
    if (dispatchError) {
      console.warn(`⚠️  Warning: Could not check dispatch references: ${dispatchError.message}`)
    }
    
    const dispatchCount = dispatchRecords ? dispatchRecords.length : 0
    
    console.log(`📊 Foreign Key References:`)
    console.log(`   - Dispatch records: ${dispatchCount}`)
    
    if (dispatchCount > 0) {
      console.log('\n⚠️  FOREIGN KEY CONSTRAINT DETECTED!\n')
      console.log(`Test Police Station Charlie is referenced by ${dispatchCount} dispatch record(s):\n`)
      
      dispatchRecords.slice(0, 5).forEach((d, i) => {
        console.log(`  ${i + 1}. Dispatch ID: ${d.id}`)
        console.log(`     Status: ${d.dispatch_status}`)
        console.log(`     Created: ${new Date(d.created_at).toLocaleString()}`)
        console.log('')
      })
      
      if (dispatchCount > 5) {
        console.log(`  ... and ${dispatchCount - 5} more record(s)\n`)
      }
      
      console.log('╔═══════════════════════════════════════════════════════════════════╗')
      console.log('║   DELETION BLOCKED - HISTORICAL DATA EXISTS                       ║')
      console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
      console.log('❌ Cannot delete Test Police Station Charlie')
      console.log('   Reason: Foreign key constraint (referenced by dispatch records)')
      console.log('   Historical dispatch data would be orphaned.\n')
      
      console.log('📋 RECOMMENDED SOLUTIONS:\n')
      console.log('Option A: Keep the station but mark it clearly')
      console.log('  - Rename to "Police Station 3 (Historical - Do Not Use)"')
      console.log('  - Update address to "Historical Record Only"')
      console.log('  - Set status to "Unavailable"')
      console.log('  - This preserves historical data integrity\n')
      
      console.log('Option B: Reassign dispatch records to another station')
      console.log('  - Update all dispatch records to reference CCPS Sub-Station IV or 11')
      console.log('  - Then delete Test Police Station Charlie')
      console.log('  - ⚠️  This alters historical dispatch data (not recommended)\n')
      
      console.log('Option C: Soft delete (recommended for production)')
      console.log('  - Add "deleted_at" column to police_stations')
      console.log('  - Set deleted_at = NOW() for Test Police Station Charlie')
      console.log('  - Filter out deleted stations in queries')
      console.log('  - Preserves referential integrity\n')
      
      return {
        success: false,
        blocked: true,
        reason: 'foreign_key_constraint',
        references: dispatchCount
      }
    }
    
    // Step 3: No references found - safe to delete
    console.log('✅ No foreign key references found - safe to delete\n')
    
    console.log('🗑️  Step 3: Deleting Test Police Station Charlie...\n')
    
    const { error: deleteError } = await supabase
      .from('police_stations')
      .delete()
      .eq('id', charlie.id)
    
    if (deleteError) {
      console.error(`❌ Deletion failed: ${deleteError.message}\n`)
      return {
        success: false,
        error: deleteError.message
      }
    }
    
    console.log('✅ Successfully deleted Test Police Station Charlie\n')
    
    // Step 4: Verify final state
    console.log('✅ Step 4: Verifying final database state...\n')
    
    const { data: finalStations, error: finalError } = await supabase
      .from('police_stations')
      .select('station_name, address, latitude, longitude, status')
      .order('station_name')
    
    if (finalError) {
      console.error(`❌ Verification failed: ${finalError.message}`)
      return
    }
    
    console.log('╔═══════════════════════════════════════════════════════════════════╗')
    console.log('║   FINAL DATABASE STATE                                            ║')
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
    
    console.log(`Active Police Stations: ${finalStations.length}\n`)
    
    finalStations.forEach((station, index) => {
      const isVerified = station.station_name.includes('CCPS Sub-Station')
      const marker = isVerified ? '✅' : '❓'
      
      console.log(`${marker} ${index + 1}. ${station.station_name}`)
      console.log(`   Address: ${station.address}`)
      console.log(`   Coordinates: ${station.latitude}, ${station.longitude}`)
      console.log(`   Status: ${station.status}`)
      console.log('')
    })
    
    // Verify expected stations
    const hasSubStation4 = finalStations.some(s => s.station_name === 'CCPS Sub-Station IV')
    const hasSubStation11 = finalStations.some(s => s.station_name === 'CCPS Sub-Station 11')
    const hasTestStations = finalStations.some(s => s.station_name.includes('Test'))
    
    console.log('╔═══════════════════════════════════════════════════════════════════╗')
    console.log('║   DELETION SUMMARY                                                ║')
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
    console.log(`✅ Test Police Station Charlie: DELETED`)
    console.log(`✅ CCPS Sub-Station IV: ${hasSubStation4 ? 'PRESENT' : '❌ MISSING'}`)
    console.log(`✅ CCPS Sub-Station 11: ${hasSubStation11 ? 'PRESENT' : '❌ MISSING'}`)
    console.log(`✅ No mock/test stations remain: ${!hasTestStations ? 'CONFIRMED' : '⚠️  STILL PRESENT'}`)
    console.log(`✅ Total active stations: ${finalStations.length}`)
    console.log('')
    
    if (finalStations.length === 2 && hasSubStation4 && hasSubStation11 && !hasTestStations) {
      console.log('🎯 SUCCESS: Database now contains only verified real police stations!\n')
    } else {
      console.log('⚠️  WARNING: Unexpected database state. Please review.\n')
    }
    
    return {
      success: true,
      deleted: true,
      references: 0,
      finalCount: finalStations.length,
      stations: finalStations.map(s => s.station_name)
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Execute
checkAndDelete()
  .then((result) => {
    if (result && result.success) {
      console.log('✅ Operation completed successfully')
      process.exit(0)
    } else if (result && result.blocked) {
      console.log('⚠️  Operation blocked due to foreign key constraints')
      process.exit(0)
    } else {
      console.log('❌ Operation failed')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
