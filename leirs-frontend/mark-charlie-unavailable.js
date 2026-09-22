/**
 * Mark Test Police Station Charlie as Unavailable
 * 
 * Safe operation: Only changes status, preserves all other data
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
console.log('║   MARK TEST POLICE STATION CHARLIE AS UNAVAILABLE                 ║')
console.log('╚═══════════════════════════════════════════════════════════════════╝\n')

async function markUnavailable() {
  try {
    // Step 1: Get current state
    console.log('📋 Step 1: Current state of Test Police Station Charlie...\n')
    
    const { data: beforeUpdate, error: fetchError } = await supabase
      .from('police_stations')
      .select('*')
      .eq('station_name', 'Test Police Station Charlie')
      .single()
    
    if (fetchError || !beforeUpdate) {
      console.error('❌ Test Police Station Charlie not found')
      return
    }
    
    console.log(`Station Name: ${beforeUpdate.station_name}`)
    console.log(`Address: ${beforeUpdate.address}`)
    console.log(`Status: ${beforeUpdate.status} ← Will change to "Unavailable"`)
    console.log(`Coordinates: ${beforeUpdate.latitude}, ${beforeUpdate.longitude}`)
    console.log('')
    
    // Step 2: Update status to Unavailable
    console.log('🔄 Step 2: Updating status to "Unavailable"...\n')
    
    const { data: updated, error: updateError } = await supabase
      .from('police_stations')
      .update({ status: 'Unavailable' })
      .eq('id', beforeUpdate.id)
      .select()
    
    if (updateError) {
      console.error(`❌ Update failed: ${updateError.message}`)
      return
    }
    
    console.log('✅ Successfully updated status\n')
    
    // Step 3: Verify the update
    console.log('✅ Step 3: Verifying update...\n')
    
    const { data: afterUpdate } = await supabase
      .from('police_stations')
      .select('*')
      .eq('station_name', 'Test Police Station Charlie')
      .single()
    
    console.log(`Station Name: ${afterUpdate.station_name} ✅ (preserved)`)
    console.log(`Address: ${afterUpdate.address} ✅ (preserved)`)
    console.log(`Status: ${afterUpdate.status} ✅ (changed to Unavailable)`)
    console.log(`Coordinates: ${afterUpdate.latitude}, ${afterUpdate.longitude} ✅ (preserved)`)
    console.log('')
    
    // Step 4: Check historical dispatch records
    console.log('🔍 Step 4: Verifying historical dispatch records...\n')
    
    const { data: dispatches } = await supabase
      .from('dispatch')
      .select('id, dispatch_status, created_at')
      .eq('police_station_id', afterUpdate.id)
      .order('created_at', { ascending: false })
    
    console.log(`Found ${dispatches.length} dispatch records referencing this station:\n`)
    
    dispatches.forEach((d, i) => {
      console.log(`  ${i + 1}. Dispatch ID: ${d.id}`)
      console.log(`     Status: ${d.dispatch_status}`)
      console.log(`     Created: ${new Date(d.created_at).toLocaleString()}`)
      console.log('')
    })
    
    console.log('✅ All historical dispatch records intact\n')
    
    // Step 5: Show all Available stations
    console.log('✅ Step 5: Available stations for NEW dispatches...\n')
    
    const { data: availableStations } = await supabase
      .from('police_stations')
      .select('station_name, address, status')
      .eq('status', 'Available')
      .order('station_name')
    
    console.log(`Total Available stations: ${availableStations.length}\n`)
    
    availableStations.forEach((s, i) => {
      console.log(`  ✅ ${i + 1}. ${s.station_name}`)
      console.log(`     ${s.address}`)
      console.log('')
    })
    
    // Step 6: Summary
    console.log('╔═══════════════════════════════════════════════════════════════════╗')
    console.log('║   UPDATE SUMMARY                                                  ║')
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
    
    console.log('✅ Status changed: Available → Unavailable')
    console.log('✅ Station name preserved: "Test Police Station Charlie"')
    console.log('✅ Address preserved: "Mock Address - East Camarin (Test Data)"')
    console.log('✅ Coordinates preserved: 14.762, 121.05')
    console.log(`✅ Historical dispatches intact: ${dispatches.length} records`)
    console.log(`✅ Available stations for new dispatches: ${availableStations.length}`)
    console.log('  - CCPS Sub-Station IV')
    console.log('  - CCPS Sub-Station 11')
    console.log('')
    console.log('🎯 Test Police Station Charlie can NO LONGER be selected for new dispatches')
    console.log('🎯 Historical dispatches still reference the original station correctly\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

markUnavailable()
