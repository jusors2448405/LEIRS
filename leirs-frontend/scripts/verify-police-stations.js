/**
 * Verify Police Station Update
 * Check current state of police stations in database
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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function verify() {
  console.log('Querying police stations...\n')
  
  const { data, error } = await supabase
    .from('police_stations')
    .select('*')
    .order('station_name')
  
  if (error) {
    console.error('Error:', error.message)
    return
  }
  
  console.log('╔═══════════════════════════════════════════════════════════════════╗')
  console.log('║   CURRENT POLICE STATIONS IN DATABASE                            ║')
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
  
  data.forEach((station, index) => {
    const isVerified = station.station_name.includes('CCPS Sub-Station')
    const isTest = station.station_name.includes('Test')
    const marker = isVerified ? '✅' : (isTest ? '⏸️' : '❓')
    
    console.log(`${marker} ${index + 1}. ${station.station_name}`)
    console.log(`   Address: ${station.address}`)
    console.log(`   Coordinates: ${station.latitude}, ${station.longitude}`)
    console.log(`   Coverage: ${station.coverage_area || 'N/A'}`)
    console.log(`   Status: ${station.status}`)
    console.log('')
  })
  
  const verifiedCount = data.filter(s => s.station_name.includes('CCPS Sub-Station')).length
  const testCount = data.filter(s => s.station_name.includes('Test')).length
  
  console.log('SUMMARY:')
  console.log(`✅ Verified real stations: ${verifiedCount}`)
  console.log(`⏸️  Test/mock stations: ${testCount}`)
  console.log(`📊 Total stations: ${data.length}`)
}

verify()
