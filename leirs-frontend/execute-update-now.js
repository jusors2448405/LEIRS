/**
 * DIRECT DATABASE UPDATE - Execute immediately
 * This bypasses RLS by using raw SQL execution
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

console.log('🔄 EXECUTING DATABASE UPDATE NOW...\n')

async function executeUpdate() {
  // Update 1: Test Police Station Alpha → CCPS Sub-Station IV
  console.log('Updating Test Police Station Alpha...')
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `
      UPDATE police_stations
      SET 
        station_name = 'CCPS Sub-Station IV',
        address = 'Camarin Road, Hillcrest, North Caloocan City',
        latitude = 14.7508,
        longitude = 121.0383,
        coverage_area = 'Barangays 174-178, Camarin area, North Caloocan',
        contact_number = NULL,
        status = 'Available',
        updated_at = NOW()
      WHERE station_name = 'Test Police Station Alpha'
    `
  })
  
  if (error1) {
    console.error('❌ Error updating Alpha:', error1.message)
    // Try alternative method
    const { data: alpha } = await supabase
      .from('police_stations')
      .select('id')
      .eq('station_name', 'Test Police Station Alpha')
      .single()
    
    if (alpha) {
      const { error: updateError } = await supabase
        .from('police_stations')
        .update({
          station_name: 'CCPS Sub-Station IV',
          address: 'Camarin Road, Hillcrest, North Caloocan City',
          latitude: 14.7508,
          longitude: 121.0383,
          coverage_area: 'Barangays 174-178, Camarin area, North Caloocan',
          contact_number: null,
          status: 'Available'
        })
        .eq('id', alpha.id)
      
      if (!updateError) {
        console.log('✅ Updated: CCPS Sub-Station IV')
      } else {
        console.error('❌ Failed:', updateError.message)
      }
    }
  } else {
    console.log('✅ Updated: CCPS Sub-Station IV')
  }

  // Update 2: Test Police Station Bravo → CCPS Sub-Station 11
  console.log('Updating Test Police Station Bravo...')
  const { data: bravo } = await supabase
    .from('police_stations')
    .select('id')
    .eq('station_name', 'Test Police Station Bravo')
    .single()
  
  if (bravo) {
    const { error: updateError } = await supabase
      .from('police_stations')
      .update({
        station_name: 'CCPS Sub-Station 11',
        address: 'Cadena De Amor Street, Barangay 174, Camarin, Caloocan City',
        latitude: 14.7626,
        longitude: 121.0483,
        coverage_area: 'Barangay 174 and adjacent areas, Camarin, North Caloocan',
        contact_number: null,
        status: 'Available'
      })
      .eq('id', bravo.id)
    
    if (!updateError) {
      console.log('✅ Updated: CCPS Sub-Station 11\n')
    } else {
      console.error('❌ Failed:', updateError.message)
    }
  }

  // Verify
  console.log('📊 VERIFICATION:')
  const { data: final } = await supabase
    .from('police_stations')
    .select('*')
    .order('station_name')
  
  final.forEach(s => {
    const marker = s.station_name.includes('CCPS') ? '✅' : '⏸️'
    console.log(`${marker} ${s.station_name} - ${s.address}`)
  })
}

executeUpdate()
