/**
 * LEIRS Database Test Data Audit
 * 
 * READ-ONLY: No data will be modified
 * 
 * Purpose: Identify test/demo data and analyze relationships
 * Output: Comprehensive audit report with cleanup recommendations
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
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

// Test data indicators
const TEST_INDICATORS = {
  titles: ['test', 'demo', 'sample', 'example', 'fake', 'mock'],
  locations: ['test', 'demo', 'sample', 'mock', 'fake address', '123 test'],
  names: ['test user', 'demo user', 'sample', 'john doe', 'jane doe', 'test123'],
  descriptions: ['test', 'demo', 'sample data', 'for testing', 'test entry']
}

function isTestData(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return TEST_INDICATORS.titles.some(indicator => lower.includes(indicator))
}

function classifyRecord(record, relatedData) {
  const indicators = {
    title: isTestData(record.incident_title),
    description: isTestData(record.incident_description),
    location: isTestData(record.location),
    reportedBy: isTestData(record.reported_by)
  }
  
  const testCount = Object.values(indicators).filter(Boolean).length
  
  if (testCount >= 2) return 'CLEARLY_TEST'
  if (testCount === 1) return 'POSSIBLY_TEST'
  
  // Check if it has real case documentation
  if (relatedData.caseDoc && relatedData.caseDoc.case_title) {
    if (isTestData(relatedData.caseDoc.case_title)) return 'POSSIBLY_TEST'
  }
  
  return 'KEEP'
}

console.log('╔═══════════════════════════════════════════════════════════════════╗')
console.log('║   LEIRS DATABASE TEST DATA AUDIT (READ-ONLY)                      ║')
console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
console.log('⚠️  READ-ONLY MODE: No data will be modified\n')

async function auditDatabase() {
  const report = {
    clearlyTest: [],
    possiblyTest: [],
    keep: [],
    historical: [],
    summary: {
      totalIncidents: 0,
      clearlyTestCount: 0,
      possiblyTestCount: 0,
      keepCount: 0,
      historicalCount: 0
    }
  }

  try {
    console.log('📊 Step 1: Fetching all incidents...\n')
    
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (incidentsError) throw incidentsError
    
    report.summary.totalIncidents = incidents.length
    console.log(`Found ${incidents.length} incidents\n`)
    
    console.log('🔍 Step 2: Analyzing each incident and its relationships...\n')
    
    for (const incident of incidents) {
      console.log(`Analyzing: ${incident.incident_title}`)
      
      // Fetch case documentation
      const { data: caseDoc } = await supabase
        .from('case_documentations')
        .select('*')
        .eq('incident_id', incident.id)
        .maybeSingle()
      
      // Fetch dispatch records
      const { data: dispatches } = await supabase
        .from('dispatch')
        .select(`
          *,
          police_stations(station_name, address)
        `)
        .eq('incident_id', incident.id)
      
      // Fetch evidence records
      const { data: evidence } = await supabase
        .from('evidence')
        .select('*')
        .eq('incident_id', incident.id)
      
      // Fetch case updates
      const { data: caseUpdates } = await supabase
        .from('case_updates')
        .select('*')
        .eq('case_id', caseDoc?.id)
      
      const relatedData = {
        caseDoc,
        dispatches: dispatches || [],
        evidence: evidence || [],
        caseUpdates: caseUpdates || []
      }
      
      const classification = classifyRecord(incident, relatedData)
      
      const record = {
        incident_id: incident.id,
        case_id: caseDoc?.id || null,
        incident_title: incident.incident_title,
        incident_type: incident.incident_type,
        location: incident.location,
        date: incident.incident_date,
        status: incident.status,
        reported_by: incident.reported_by,
        case_documentation: caseDoc ? {
          case_number: caseDoc.case_number,
          case_title: caseDoc.case_title,
          status: caseDoc.status
        } : null,
        dispatches: dispatches?.map(d => ({
          id: d.id,
          status: d.dispatch_status,
          station: d.police_stations?.station_name,
          created: d.created_at
        })) || [],
        evidence: evidence?.map(e => ({
          id: e.id,
          type: e.evidence_type,
          name: e.evidence_name
        })) || [],
        case_updates: caseUpdates?.length || 0,
        has_dependencies: !!(dispatches?.length || evidence?.length || caseUpdates?.length),
        safe_to_delete: !(dispatches?.length || evidence?.length || caseUpdates?.length),
        indicators: {
          test_in_title: isTestData(incident.incident_title),
          test_in_description: isTestData(incident.incident_description),
          test_in_location: isTestData(incident.location),
          test_in_reporter: isTestData(incident.reported_by)
        }
      }
      
      // Check if it's historical (has completed dispatches)
      const hasCompletedDispatch = dispatches?.some(d => d.dispatch_status === 'Completed')
      
      if (hasCompletedDispatch && classification === 'KEEP') {
        report.historical.push(record)
        report.summary.historicalCount++
      } else if (classification === 'CLEARLY_TEST') {
        report.clearlyTest.push(record)
        report.summary.clearlyTestCount++
      } else if (classification === 'POSSIBLY_TEST') {
        report.possiblyTest.push(record)
        report.summary.possiblyTestCount++
      } else {
        report.keep.push(record)
        report.summary.keepCount++
      }
    }
    
    console.log('\n✅ Analysis complete\n')
    
    // Generate report
    generateReport(report)
    
    return report
    
  } catch (error) {
    console.error('❌ Error during audit:', error.message)
    throw error
  }
}

function generateReport(report) {
  console.log('╔═══════════════════════════════════════════════════════════════════╗')
  console.log('║   AUDIT SUMMARY                                                   ║')
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n')
  
  console.log(`Total Incidents: ${report.summary.totalIncidents}`)
  console.log(`  ❌ Clearly Test/Demo: ${report.summary.clearlyTestCount}`)
  console.log(`  ⚠️  Possibly Test: ${report.summary.possiblyTestCount}`)
  console.log(`  ✅ Keep (Real Data): ${report.summary.keepCount}`)
  console.log(`  📋 Historical (Keep): ${report.summary.historicalCount}`)
  console.log('')
  
  // Section A: Clearly Test/Demo Data
  if (report.clearlyTest.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════════')
    console.log('A. CLEARLY TEST/DEMO DATA (Safe to Remove)')
    console.log('═══════════════════════════════════════════════════════════════════\n')
    
    report.clearlyTest.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.incident_title}`)
      console.log(`   Incident ID: ${rec.incident_id}`)
      if (rec.case_id) console.log(`   Case ID: ${rec.case_id}`)
      console.log(`   Type: ${rec.incident_type}`)
      console.log(`   Location: ${rec.location}`)
      console.log(`   Date: ${rec.date}`)
      console.log(`   Status: ${rec.status}`)
      console.log(`   Reported By: ${rec.reported_by}`)
      
      if (rec.case_documentation) {
        console.log(`   Case: ${rec.case_documentation.case_number} - ${rec.case_documentation.case_title}`)
      }
      
      console.log(`   Dependencies:`)
      console.log(`     - Dispatches: ${rec.dispatches.length}`)
      console.log(`     - Evidence: ${rec.evidence.length}`)
      console.log(`     - Case Updates: ${rec.case_updates}`)
      
      console.log(`   Test Indicators:`)
      if (rec.indicators.test_in_title) console.log(`     ⚠️  Test keyword in title`)
      if (rec.indicators.test_in_description) console.log(`     ⚠️  Test keyword in description`)
      if (rec.indicators.test_in_location) console.log(`     ⚠️  Test keyword in location`)
      if (rec.indicators.test_in_reporter) console.log(`     ⚠️  Test keyword in reporter`)
      
      console.log(`   Safe to Delete: ${rec.safe_to_delete ? '✅ YES' : '❌ NO (has dependencies)'}`)
      
      if (!rec.safe_to_delete) {
        console.log(`   Deletion Order Required:`)
        if (rec.case_updates > 0) console.log(`     1. Delete ${rec.case_updates} case update(s)`)
        if (rec.evidence.length > 0) console.log(`     2. Delete ${rec.evidence.length} evidence record(s)`)
        if (rec.dispatches.length > 0) console.log(`     3. Delete ${rec.dispatches.length} dispatch record(s)`)
        if (rec.case_documentation) console.log(`     4. Delete case documentation`)
        console.log(`     5. Delete incident`)
      }
      
      console.log('')
    })
  }
  
  // Section B: Possibly Test Data
  if (report.possiblyTest.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════════')
    console.log('B. POSSIBLY TEST DATA (Needs Review)')
    console.log('═══════════════════════════════════════════════════════════════════\n')
    
    report.possiblyTest.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.incident_title}`)
      console.log(`   Incident ID: ${rec.incident_id}`)
      console.log(`   Type: ${rec.incident_type}`)
      console.log(`   Location: ${rec.location}`)
      console.log(`   Status: ${rec.status}`)
      console.log(`   Dependencies: Dispatches=${rec.dispatches.length}, Evidence=${rec.evidence.length}`)
      console.log(`   Reason: One test indicator found`)
      console.log('')
    })
  }
  
  // Section C: Real/Keep
  if (report.keep.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════════')
    console.log('C. REAL DATA (Keep)')
    console.log('═══════════════════════════════════════════════════════════════════\n')
    
    report.keep.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.incident_title}`)
      console.log(`   Type: ${rec.incident_type}`)
      console.log(`   Status: ${rec.status}`)
      console.log(`   Dependencies: Dispatches=${rec.dispatches.length}, Evidence=${rec.evidence.length}`)
      console.log('')
    })
  }
  
  // Section D: Historical
  if (report.historical.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════════')
    console.log('D. HISTORICAL RECORDS (Do Not Delete)')
    console.log('═══════════════════════════════════════════════════════════════════\n')
    
    report.historical.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.incident_title}`)
      console.log(`   Incident ID: ${rec.incident_id}`)
      console.log(`   Completed Dispatches: ${rec.dispatches.filter(d => d.status === 'Completed').length}`)
      console.log(`   Reason: Has completed dispatch workflow`)
      console.log('')
    })
  }
  
  // Generate cleanup plan
  if (report.clearlyTest.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════════')
    console.log('PROPOSED CLEANUP PLAN')
    console.log('═══════════════════════════════════════════════════════════════════\n')
    
    console.log('⚠️  IMPORTANT: Execute in this exact order to respect foreign keys:\n')
    
    let step = 1
    const totalCaseUpdates = report.clearlyTest.reduce((sum, r) => sum + r.case_updates, 0)
    const totalEvidence = report.clearlyTest.reduce((sum, r) => sum + r.evidence.length, 0)
    const totalDispatches = report.clearlyTest.reduce((sum, r) => sum + r.dispatches.length, 0)
    const totalCases = report.clearlyTest.filter(r => r.case_id).length
    
    if (totalCaseUpdates > 0) {
      console.log(`Step ${step++}: Delete ${totalCaseUpdates} case update record(s)`)
      console.log(`   Table: case_updates`)
      console.log(`   Filter: case_id IN (...)`)
      console.log('')
    }
    
    if (totalEvidence > 0) {
      console.log(`Step ${step++}: Delete ${totalEvidence} evidence record(s)`)
      console.log(`   Table: evidence`)
      console.log(`   Filter: incident_id IN (...)`)
      console.log('')
    }
    
    if (totalDispatches > 0) {
      console.log(`Step ${step++}: Delete ${totalDispatches} dispatch record(s)`)
      console.log(`   Table: dispatch`)
      console.log(`   Filter: incident_id IN (...)`)
      console.log('')
    }
    
    if (totalCases > 0) {
      console.log(`Step ${step++}: Delete ${totalCases} case documentation record(s)`)
      console.log(`   Table: case_documentations`)
      console.log(`   Filter: incident_id IN (...)`)
      console.log('')
    }
    
    console.log(`Step ${step}: Delete ${report.clearlyTest.length} incident record(s)`)
    console.log(`   Table: incidents`)
    console.log(`   Filter: id IN (...)`)
    console.log('')
    
    console.log('Test Incident IDs to Delete:')
    report.clearlyTest.forEach(rec => {
      console.log(`  - ${rec.incident_id} (${rec.incident_title})`)
    })
  } else {
    console.log('═══════════════════════════════════════════════════════════════════')
    console.log('CLEANUP PLAN')
    console.log('═══════════════════════════════════════════════════════════════════\n')
    console.log('✅ No clearly-identified test data found.')
    console.log('   Review "Possibly Test Data" section manually.')
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('⚠️  AUDIT COMPLETE - WAITING FOR APPROVAL')
  console.log('═══════════════════════════════════════════════════════════════════\n')
  console.log('Next Steps:')
  console.log('1. Review this report carefully')
  console.log('2. Verify classifications are correct')
  console.log('3. Approve cleanup plan')
  console.log('4. Execute cleanup script (will be generated after approval)\n')
  
  // Save report to file
  const reportContent = JSON.stringify(report, null, 2)
  writeFileSync(join(__dirname, 'TEST_DATA_AUDIT_REPORT.json'), reportContent)
  console.log('📄 Detailed report saved to: TEST_DATA_AUDIT_REPORT.json\n')
}

// Execute audit
auditDatabase()
  .then(() => {
    console.log('✅ Audit completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  })
