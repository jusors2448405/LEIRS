// ═══════════════════════════════════════════════════════════════════════════
// NEW Supabase Connection Verification Script
// Read-only verification of connection to NEW project: kyvhyhmqwcxbloiliojw
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

// NEW project credentials
const supabaseUrl = 'https://kyvhyhmqwcxbloiliojw.supabase.co'
const supabaseAnonKey = 'sb_publishable_17FzwGTxf5fon1MFiTNtUA_COCWk1P6'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyConnection() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('NEW Supabase Connection Verification')
  console.log('Project: kyvhyhmqwcxbloiliojw')
  console.log('Mode: READ-ONLY')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const results = {
    connection: 'PENDING',
    tables: {},
    policeStations: 'PENDING'
  }

  // Test 1: Check connection with a simple query
  console.log('Test 1: Verifying connection...')
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
    
    if (error) {
      console.log(`  ❌ Connection failed: ${error.message}`)
      results.connection = 'FAIL'
      return results
    } else {
      console.log(`  ✅ Connection successful`)
      results.connection = 'PASS'
    }
  } catch (err) {
    console.log(`  ❌ Connection error: ${err.message}`)
    results.connection = 'FAIL'
    return results
  }

  // Test 2: Verify all 7 operational tables are accessible
  console.log('\nTest 2: Verifying 7 operational tables...')
  const tables = [
    'incidents',
    'case_documentations',
    'dispatch',
    'case_updates',
    'evidence',
    'evidence_custody',
    'police_stations'
  ]

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`  ❌ ${table}: ERROR - ${error.message}`)
        results.tables[table] = 'FAIL'
      } else {
        console.log(`  ✅ ${table}: ${count} rows`)
        results.tables[table] = count
      }
    } catch (err) {
      console.log(`  ❌ ${table}: EXCEPTION - ${err.message}`)
      results.tables[table] = 'FAIL'
    }
  }

  // Test 3: Verify police_stations contains expected test data
  console.log('\nTest 3: Verifying police_stations test data...')
  try {
    const { data, error } = await supabase
      .from('police_stations')
      .select('station_name, status, latitude, longitude')
      .order('station_name')

    if (error) {
      console.log(`  ❌ Error: ${error.message}`)
      results.policeStations = 'FAIL'
    } else if (!data || data.length === 0) {
      console.log(`  ⚠️  No police stations found (expected 3 test stations)`)
      results.policeStations = 'EMPTY'
    } else {
      console.log(`  ✅ Found ${data.length} police stations:`)
      data.forEach(station => {
        console.log(`     - ${station.station_name} (${station.status})`)
        console.log(`       Coordinates: ${station.latitude}, ${station.longitude}`)
      })
      
      // Check for expected test stations
      const hasAlpha = data.some(s => s.station_name.includes('Alpha'))
      const hasBravo = data.some(s => s.station_name.includes('Bravo'))
      const hasCharlie = data.some(s => s.station_name.includes('Charlie'))
      
      if (hasAlpha && hasBravo && hasCharlie) {
        console.log(`  ✅ All 3 test stations found (Alpha, Bravo, Charlie)`)
        results.policeStations = 'PASS'
      } else {
        console.log(`  ⚠️  Expected test stations not all found`)
        results.policeStations = 'PARTIAL'
      }
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}`)
    results.policeStations = 'FAIL'
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('Verification Summary:')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Connection: ${results.connection}`)
  console.log(`Police Stations Test Data: ${results.policeStations}`)
  console.log('\nTable Access:')
  for (const [table, status] of Object.entries(results.tables)) {
    const statusStr = typeof status === 'number' ? `✅ ${status} rows` : `❌ ${status}`
    console.log(`  ${table}: ${statusStr}`)
  }

  // Final verdict
  const allTablesPass = Object.values(results.tables).every(v => typeof v === 'number')
  const overallPass = results.connection === 'PASS' && allTablesPass && results.policeStations === 'PASS'

  console.log('\n═══════════════════════════════════════════════════════════════')
  if (overallPass) {
    console.log('✅ OVERALL: PASS - NEW Supabase database connection verified')
  } else {
    console.log('❌ OVERALL: FAIL - Issues detected, see details above')
  }
  console.log('═══════════════════════════════════════════════════════════════')

  return results
}

verifyConnection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
