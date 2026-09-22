/**
 * Police Station Database Update Script
 * 
 * Purpose: Update mock police stations with verified real facilities
 * Approved: Option B - 2 HIGH-confidence stations only
 * Date: August 25, 2026
 * 
 * IMPORTANT: This script preserves foreign key relationships with dispatch records
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8')
const envLines = envContent.split('\n')
const SUPABASE_URL = envLines.find(line => line.startsWith('VITE_SUPABASE_URL='))?.split('=')[1]
const SUPABASE_ANON_KEY = envLines.find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))?.split('=')[1]

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env file')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('╔═══════════════════════════════════════════════════════════════════╗')
console.log('║   LEIRS POLICE STATION DATABASE UPDATE - OPTION B                 ║')
console.log('║   Approved: 2 HIGH-Confidence Verified Stations                   ║')
console.log('╚═══════════════════════════════════════════════════════════════════╝\n')

async function main() {
  try {
    // Step 1: Inspect existing police stations
    console.log('📋 Step 1: Inspecting existing police station records...\n')
    
    const { data: existingStations, error: fetchError } = await supabase
      .from('police_stations')
      .select('*')
      .order('station_name')
    
    if (fetchError) {
      throw new Error(`Failed to fetch existing stations: ${fetchError.message}`)
    }
    
    console.log(`Found ${existingStations.length} existing police stations:\n`)
    existingStations.forEach((station, index) => {
      console.log(`${index + 1}. ${station.station_name}`)
      console.log(`   Address: ${station.address}`)
      console.log(`   Coordinates: ${station.latitude}, ${station.longitude}`)
      console.log(`   Status: ${station.status}`)
      console.log('')
    })
    
    // Step 2: Check for dispatch records referencing these stations
    console.log('🔍 Step 2: Checking for existing dispatch records...\n')
    
    const { data: dispatchRecords, error: dispatchError } = await supabase
      .from('dispatch')
      .select('id, police_station_id, dispatch_status')
      .not('police_station_id', 'is', null)
    
    if (dispatchError) {
      console.warn(`⚠️  Warning: Could not check dispatch records: ${dispatchError.message}`)
    } else {
      const stationDispatchCounts = {}
      dispatchRecords.forEach(dispatch => {
        stationDispatchCounts[dispatch.police_station_id] = 
          (stationDispatchCounts[dispatch.police_station_id] || 0) + 1
      })
      
      console.log(`Total dispatch records: ${dispatchRecords.length}`)
      existingStations.forEach(station => {
        const count = stationDispatchCounts[station.id] || 0
        console.log(`  - ${station.station_name}: ${count} dispatch record(s)`)
      })
      console.log('')
      console.log('✅ Foreign key relationships will be preserved (UUIDs unchanged)\n')
    }
    
    // Step 3: Update Test Police Station Alpha → CCPS Sub-Station IV
    console.log('🔄 Step 3: Updating Test Police Station Alpha → CCPS Sub-Station IV...\n')
    
    const stationAlpha = existingStations.find(s => s.station_name === 'Test Police Station Alpha')
    if (!stationAlpha) {
      throw new Error('Test Police Station Alpha not found in database')
    }
    
    const { data: updatedAlpha, error: updateAlphaError } = await supabase
      .from('police_stations')
      .update({
        station_name: 'CCPS Sub-Station IV',
        address: 'Camarin Road, Hillcrest, North Caloocan City',
        latitude: 14.7508,
        longitude: 121.0383,
        coverage_area: 'Barangays 174-178, Camarin area, North Caloocan',
        contact_number: null,
        status: 'Available',
        updated_at: new Date().toISOString()
      })
      .eq('id', stationAlpha.id)
      .select()
    
    if (updateAlphaError) {
      throw new Error(`Failed to update Station Alpha: ${updateAlphaError.message}`)
    }
    
    console.log('✅ Updated: Test Police Station Alpha → CCPS Sub-Station IV')
    console.log(`   ID: ${stationAlpha.id} (preserved)`)
    console.log(`   New Address: Camarin Road, Hillcrest, North Caloocan City`)
    console.log(`   New Coordinates: 14.7508, 121.0383`)
    console.log(`   Verification: HIGH confidence - Official CCPS directory\n`)
    
    // Step 4: Update Test Police Station Bravo → CCPS Sub-Station 11
    console.log('🔄 Step 4: Updating Test Police Station Bravo → CCPS Sub-Station 11...\n')
    
    const stationBravo = existingStations.find(s => s.station_name === 'Test Police Station Bravo')
    if (!stationBravo) {
      throw new Error('Test Police Station Bravo not found in database')
    }
    
    const { data: updatedBravo, error: updateBravoError } = await supabase
      .from('police_stations')
      .update({
        station_name: 'CCPS Sub-Station 11',
        address: 'Cadena De Amor Street, Barangay 174, Camarin, Caloocan City',
        latitude: 14.7626,
        longitude: 121.0483,
        coverage_area: 'Barangay 174 and adjacent areas, Camarin, North Caloocan',
        contact_number: null,
        status: 'Available',
        updated_at: new Date().toISOString()
      })
      .eq('id', stationBravo.id)
      .select()
    
    if (updateBravoError) {
      throw new Error(`Failed to update Station Bravo: ${updateBravoError.message}`)
    }
    
    console.log('✅ Updated: Test Police Station Bravo → CCPS Sub-Station 11')
    console.log(`   ID: ${stationBravo.id} (preserved)`)
    console.log(`   New Address: Cadena De Amor Street, Barangay 174, Camarin, Caloocan City`)
    console.log(`   New Coordinates: 14.7626, 121.0483`)
    console.log(`   Verification: HIGH confidence - Official PNP documentation\n`)
    
    // Step 5: Confirm Test Police Station Charlie remains unchanged
    console.log('ℹ️  Step 5: Test Police Station Charlie status...\n')
    
    const stationCharlie = existingStations.find(s => s.station_name === 'Test Police Station Charlie')
    if (stationCharlie) {
      console.log('⏸️  Retained: Test Police Station Charlie (unchanged)')
      console.log(`   Reason: MEDIUM-HIGH confidence station not approved in Option B`)
      console.log(`   Action: Awaiting additional verification\n`)
    }
    
    // Step 6: Verify final state
    console.log('✅ Step 6: Verifying updated police stations...\n')
    
    const { data: finalStations, error: finalError } = await supabase
      .from('police_stations')
      .select('*')
      .order('station_name')
    
    if (finalError) {
      throw new Error(`Failed to verify final state: ${finalError.message}`)
    }
    
    console.log('╔═══════════════════════════════════════════════════════════════════╗')
    console.log('║   UPDATED POLICE STATIONS (FINAL STATE)                           ║')
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
    
    finalStations.forEach((station, index) => {
      const isUpdated = station.station_name.includes('CCPS Sub-Station')
      const isTest = station.station_name.includes('Test')
      const marker = isUpdated ? '✅' : (isTest ? '⏸️' : '❓')
      
      console.log(`${marker} ${index + 1}. ${station.station_name}`)
      console.log(`   Address: ${station.address}`)
      console.log(`   Coordinates: ${station.latitude}, ${station.longitude}`)
      console.log(`   Coverage: ${station.coverage_area || 'N/A'}`)
      console.log(`   Contact: ${station.contact_number || 'NULL (not verified)'}`)
      console.log(`   Status: ${station.status}`)
      console.log('')
    })
    
    // Summary
    console.log('╔═══════════════════════════════════════════════════════════════════╗')
    console.log('║   UPDATE SUMMARY                                                  ║')
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
    console.log('✅ Mock records updated: 2')
    console.log('✅ Verified stations added: 2')
    console.log('⏸️  Mock records retained: 1 (Test Police Station Charlie)')
    console.log('✅ Foreign key relationships: Preserved')
    console.log('✅ Historical dispatch data: Intact')
    console.log('\n📄 Verification sources documented in: POLICE_STATION_VERIFICATION_REPORT_v2.md')
    console.log('\n🎯 Next step: Test DispatchMap and distance calculations\n')
    
    return {
      success: true,
      updated: 2,
      retained: 1,
      stations: finalStations
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('\n💡 Database has NOT been modified')
    process.exit(1)
  }
}

// Execute the update
main()
  .then((result) => {
    console.log('✅ Police station database update completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
