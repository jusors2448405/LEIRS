/**
 * LEIRS Database Audit Script
 * READ-ONLY analysis for capstone defense preparation
 * 
 * Run: node audit-database.js
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Read .env file manually (simpler than dotenv dependency)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')

let supabaseUrl, supabaseKey
envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim()
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim()
  }
})

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const auditReport = {
  timestamp: new Date().toISOString(),
  summary: {},
  issues: [],
  recommendations: []
}

// Helper functions
function addIssue(category, table, recordId, field, currentValue, proposedValue, reason) {
  auditReport.issues.push({
    category,
    table,
    recordId,
    field,
    currentValue,
    proposedValue,
    reason
  })
}

function detectTestData(text) {
  if (!text) return false
  const testPatterns = /test|mock|sample|fake|placeholder|kiko|alpha|bravo|charlie|dummy/i
  return testPatterns.test(text)
}

function normalizeLocation(location) {
  if (!location) return null
  
  // Common Barangay 178, Camarin locations (proper capitalization)
  const locationMap = {
    'camarin': 'Camarin',
    'camarin caloocan': 'Camarin, Caloocan City',
    'zapote rd': 'Zapote Road, Camarin',
    'zapote road': 'Zapote Road, Camarin',
    'kiko camarin': 'Camarin, Caloocan City',
    'barangay 178': 'Barangay 178, Camarin',
    'brgy 178': 'Barangay 178, Camarin',
    'bagong silang': 'Bagong Silang, Caloocan City'
  }
  
  const lower = location.toLowerCase().trim()
  return locationMap[lower] || location.trim()
}

async function auditIncidents() {
  console.log('\n📋 Auditing incidents table...')
  
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching incidents:', error)
    return
  }
  
  auditReport.summary.totalIncidents = data.length
  
  const locationCounts = {}
  const incidentTypes = {}
  const priorities = {}
  const statuses = {}
  
  for (const incident of data) {
    // Check for test/mock data
    if (detectTestData(incident.complainant_name)) {
      addIssue(
        'TEST_DATA',
        'incidents',
        incident.id,
        'complainant_name',
        incident.complainant_name,
        'Realistic fictional name (e.g., "Juan Dela Cruz")',
        'Contains test/mock keywords'
      )
    }
    
    if (detectTestData(incident.description)) {
      addIssue(
        'TEST_DATA',
        'incidents',
        incident.id,
        'description',
        incident.description?.substring(0, 50) + '...',
        'Realistic incident description',
        'Contains test/mock keywords'
      )
    }
    
    if (detectTestData(incident.location)) {
      addIssue(
        'TEST_DATA',
        'incidents',
        incident.id,
        'location',
        incident.location,
        'Realistic Camarin location',
        'Contains test/mock keywords'
      )
    }
    
    // Check location consistency
    const normalized = normalizeLocation(incident.location)
    if (normalized !== incident.location) {
      addIssue(
        'LOCATION_INCONSISTENT',
        'incidents',
        incident.id,
        'location',
        incident.location,
        normalized,
        'Location capitalization/format inconsistent'
      )
    }
    
    // Track location distribution
    locationCounts[incident.location] = (locationCounts[incident.location] || 0) + 1
    incidentTypes[incident.incident_type] = (incidentTypes[incident.incident_type] || 0) + 1
    priorities[incident.priority] = (priorities[incident.priority] || 0) + 1
    statuses[incident.status] = (statuses[incident.status] || 0) + 1
  }
  
  auditReport.summary.locations = locationCounts
  auditReport.summary.incidentTypes = incidentTypes
  auditReport.summary.priorities = priorities
  auditReport.summary.statuses = statuses
  
  console.log(`✓ Audited ${data.length} incidents`)
}

async function auditCaseDocumentations() {
  console.log('\n📁 Auditing case_documentations table...')
  
  const { data, error } = await supabase
    .from('case_documentations')
    .select('*')
  
  if (error) {
    console.error('Error fetching case_documentations:', error)
    return
  }
  
  auditReport.summary.totalCases = data.length
  
  // Check for orphaned cases (incident_id doesn't exist)
  const { data: incidents } = await supabase
    .from('incidents')
    .select('id')
  
  const incidentIds = new Set(incidents?.map(i => i.id) || [])
  
  for (const caseDoc of data) {
    if (!incidentIds.has(caseDoc.incident_id)) {
      addIssue(
        'ORPHANED_RECORD',
        'case_documentations',
        caseDoc.incident_id,
        'incident_id',
        caseDoc.incident_id,
        'DELETE or reassign to valid incident',
        'References non-existent incident'
      )
    }
    
    // Check for test data in notes
    if (detectTestData(caseDoc.case_notes)) {
      addIssue(
        'TEST_DATA',
        'case_documentations',
        caseDoc.incident_id,
        'case_notes',
        caseDoc.case_notes?.substring(0, 50) + '...',
        'Realistic case notes',
        'Contains test/mock keywords'
      )
    }
  }
  
  console.log(`✓ Audited ${data.length} case documentations`)
}

async function auditDispatch() {
  console.log('\n🚔 Auditing dispatch table...')
  
  const { data, error } = await supabase
    .from('dispatch')
    .select('*')
  
  if (error) {
    console.error('Error fetching dispatch:', error)
    return
  }
  
  auditReport.summary.totalDispatches = data.length
  
  const { data: incidents } = await supabase.from('incidents').select('id')
  const incidentIds = new Set(incidents?.map(i => i.id) || [])
  
  const { data: stations } = await supabase.from('police_stations').select('id')
  const stationIds = new Set(stations?.map(s => s.id) || [])
  
  const dispatchStatuses = {}
  
  for (const dispatch of data) {
    // Check for orphaned dispatches
    if (!incidentIds.has(dispatch.incident_id)) {
      addIssue(
        'ORPHANED_RECORD',
        'dispatch',
        dispatch.id,
        'incident_id',
        dispatch.incident_id,
        'DELETE or reassign to valid incident',
        'References non-existent incident'
      )
    }
    
    if (!stationIds.has(dispatch.police_station_id)) {
      addIssue(
        'ORPHANED_RECORD',
        'dispatch',
        dispatch.id,
        'police_station_id',
        dispatch.police_station_id,
        'Reassign to valid police station',
        'References non-existent police station'
      )
    }
    
    // Check for test data
    if (detectTestData(dispatch.officer_name)) {
      addIssue(
        'TEST_DATA',
        'dispatch',
        dispatch.id,
        'officer_name',
        dispatch.officer_name,
        'Realistic officer name (e.g., "PO1 Jose Santos")',
        'Contains test/mock keywords'
      )
    }
    
    if (detectTestData(dispatch.dispatch_notes)) {
      addIssue(
        'TEST_DATA',
        'dispatch',
        dispatch.id,
        'dispatch_notes',
        dispatch.dispatch_notes?.substring(0, 50) + '...',
        'Realistic dispatch notes',
        'Contains test/mock keywords'
      )
    }
    
    dispatchStatuses[dispatch.dispatch_status] = (dispatchStatuses[dispatch.dispatch_status] || 0) + 1
  }
  
  auditReport.summary.dispatchStatuses = dispatchStatuses
  
  console.log(`✓ Audited ${data.length} dispatches`)
}

async function auditEvidence() {
  console.log('\n🔍 Auditing evidence table...')
  
  const { data, error } = await supabase
    .from('evidence')
    .select('*')
  
  if (error) {
    console.error('Error fetching evidence:', error)
    return
  }
  
  auditReport.summary.totalEvidence = data.length
  
  const { data: incidents } = await supabase.from('incidents').select('id')
  const incidentIds = new Set(incidents?.map(i => i.id) || [])
  
  const evidenceTypes = {}
  const evidenceStatuses = {}
  
  for (const evidence of data) {
    // Check for orphaned evidence
    if (!incidentIds.has(evidence.incident_id)) {
      addIssue(
        'ORPHANED_RECORD',
        'evidence',
        evidence.id,
        'incident_id',
        evidence.incident_id,
        'DELETE or reassign to valid incident',
        'References non-existent incident'
      )
    }
    
    // Check for test data
    if (detectTestData(evidence.evidence_name)) {
      addIssue(
        'TEST_DATA',
        'evidence',
        evidence.id,
        'evidence_name',
        evidence.evidence_name,
        'Realistic evidence description',
        'Contains test/mock keywords'
      )
    }
    
    if (detectTestData(evidence.description)) {
      addIssue(
        'TEST_DATA',
        'evidence',
        evidence.id,
        'description',
        evidence.description?.substring(0, 50) + '...',
        'Realistic evidence description',
        'Contains test/mock keywords'
      )
    }
    
    evidenceTypes[evidence.evidence_type] = (evidenceTypes[evidence.evidence_type] || 0) + 1
    evidenceStatuses[evidence.status] = (evidenceStatuses[evidence.status] || 0) + 1
  }
  
  auditReport.summary.evidenceTypes = evidenceTypes
  auditReport.summary.evidenceStatuses = evidenceStatuses
  
  console.log(`✓ Audited ${data.length} evidence records`)
}

async function auditPoliceStations() {
  console.log('\n🚓 Auditing police_stations table...')
  
  const { data, error } = await supabase
    .from('police_stations')
    .select('*')
  
  if (error) {
    console.error('Error fetching police_stations:', error)
    return
  }
  
  auditReport.summary.totalPoliceStations = data.length
  
  for (const station of data) {
    // Check for test data
    if (detectTestData(station.station_name)) {
      addIssue(
        'TEST_DATA',
        'police_stations',
        station.id,
        'station_name',
        station.station_name,
        'Generic but professional name (e.g., "North Caloocan Police Station")',
        'Contains test/mock keywords'
      )
    }
    
    if (detectTestData(station.address)) {
      addIssue(
        'TEST_DATA',
        'police_stations',
        station.id,
        'address',
        station.address,
        'Generic professional address',
        'Contains test/mock keywords'
      )
    }
    
    if (detectTestData(station.contact_number)) {
      addIssue(
        'TEST_DATA',
        'police_stations',
        station.id,
        'contact_number',
        station.contact_number,
        'Generic contact format (e.g., "(02) 8XXX-XXXX")',
        'Contains test/mock keywords'
      )
    }
  }
  
  console.log(`✓ Audited ${data.length} police stations`)
}

async function auditCaseUpdates() {
  console.log('\n📝 Auditing case_updates table...')
  
  const { data, error } = await supabase
    .from('case_updates')
    .select('*')
  
  if (error) {
    console.error('Error fetching case_updates:', error)
    return
  }
  
  auditReport.summary.totalCaseUpdates = data.length
  
  const { data: incidents } = await supabase.from('incidents').select('id')
  const incidentIds = new Set(incidents?.map(i => i.id) || [])
  
  for (const update of data) {
    // Check for orphaned updates
    if (!incidentIds.has(update.incident_id)) {
      addIssue(
        'ORPHANED_RECORD',
        'case_updates',
        update.id,
        'incident_id',
        update.incident_id,
        'DELETE or reassign to valid incident',
        'References non-existent incident'
      )
    }
    
    // Check for test data
    if (detectTestData(update.update_text)) {
      addIssue(
        'TEST_DATA',
        'case_updates',
        update.id,
        'update_text',
        update.update_text?.substring(0, 50) + '...',
        'Realistic case update text',
        'Contains test/mock keywords'
      )
    }
  }
  
  console.log(`✓ Audited ${data.length} case updates`)
}

async function analyzeWorkflowConsistency() {
  console.log('\n🔄 Analyzing workflow consistency...')
  
  // Get incidents with their related records
  const { data: incidents } = await supabase.from('incidents').select('id, status, incident_type')
  const { data: cases } = await supabase.from('case_documentations').select('incident_id, case_status')
  const { data: dispatches } = await supabase.from('dispatch').select('incident_id, dispatch_status')
  const { data: evidence } = await supabase.from('evidence').select('incident_id')
  
  const casesByIncident = new Map()
  const dispatchesByIncident = new Map()
  const evidenceByIncident = new Map()
  
  cases?.forEach(c => casesByIncident.set(c.incident_id, c))
  dispatches?.forEach(d => {
    if (!dispatchesByIncident.has(d.incident_id)) {
      dispatchesByIncident.set(d.incident_id, [])
    }
    dispatchesByIncident.get(d.incident_id).push(d)
  })
  evidence?.forEach(e => {
    if (!evidenceByIncident.has(e.incident_id)) {
      evidenceByIncident.set(e.incident_id, [])
    }
    evidenceByIncident.get(e.incident_id).push(e)
  })
  
  for (const incident of incidents || []) {
    const hasCase = casesByIncident.has(incident.id)
    const hasDispatch = dispatchesByIncident.has(incident.id)
    const hasEvidence = evidenceByIncident.has(incident.id)
    
    const dispatches = dispatchesByIncident.get(incident.id) || []
    const completedDispatches = dispatches.filter(d => d.dispatch_status === 'Completed')
    
    // Check: If incident is closed/resolved, should have case documentation
    if (['Resolved', 'Closed'].includes(incident.status) && !hasCase) {
      addIssue(
        'WORKFLOW_INCONSISTENT',
        'incidents',
        incident.id,
        'status',
        incident.status,
        'Should have case_documentation record',
        'Resolved/Closed incident without case documentation'
      )
    }
    
    // Check: If has completed dispatch, should be eligible for evidence
    if (completedDispatches.length > 0 && !hasEvidence) {
      // This is actually EXPECTED for new cases - not an issue
      // Just track it for information
    }
    
    // Check: Evidence without completed dispatch
    if (hasEvidence && completedDispatches.length === 0) {
      addIssue(
        'WORKFLOW_INCONSISTENT',
        'evidence',
        incident.id,
        'incident_id',
        incident.id,
        'Verify dispatch completion before evidence',
        'Evidence exists but no completed dispatch found'
      )
    }
  }
  
  console.log('✓ Workflow consistency analysis complete')
}

async function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('LEIRS DATABASE AUDIT REPORT')
  console.log('='.repeat(60))
  
  console.log('\n📊 SUMMARY')
  console.log('─'.repeat(60))
  console.log(`Total Incidents: ${auditReport.summary.totalIncidents || 0}`)
  console.log(`Total Cases: ${auditReport.summary.totalCases || 0}`)
  console.log(`Total Dispatches: ${auditReport.summary.totalDispatches || 0}`)
  console.log(`Total Evidence: ${auditReport.summary.totalEvidence || 0}`)
  console.log(`Total Case Updates: ${auditReport.summary.totalCaseUpdates || 0}`)
  console.log(`Total Police Stations: ${auditReport.summary.totalPoliceStations || 0}`)
  
  console.log('\n📍 LOCATION DISTRIBUTION')
  console.log('─'.repeat(60))
  Object.entries(auditReport.summary.locations || {})
    .sort((a, b) => b[1] - a[1])
    .forEach(([loc, count]) => console.log(`${loc}: ${count}`))
  
  console.log('\n📋 INCIDENT TYPES')
  console.log('─'.repeat(60))
  Object.entries(auditReport.summary.incidentTypes || {})
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => console.log(`${type}: ${count}`))
  
  console.log('\n🚨 ISSUES FOUND')
  console.log('─'.repeat(60))
  console.log(`Total Issues: ${auditReport.issues.length}`)
  
  // Group issues by category
  const issuesByCategory = {}
  auditReport.issues.forEach(issue => {
    if (!issuesByCategory[issue.category]) {
      issuesByCategory[issue.category] = []
    }
    issuesByCategory[issue.category].push(issue)
  })
  
  Object.entries(issuesByCategory).forEach(([category, issues]) => {
    console.log(`\n${category}: ${issues.length} issue(s)`)
    issues.slice(0, 5).forEach(issue => {
      console.log(`  • ${issue.table}.${issue.field}: "${issue.currentValue}" → "${issue.proposedValue}"`)
      console.log(`    Reason: ${issue.reason}`)
    })
    if (issues.length > 5) {
      console.log(`  ... and ${issues.length - 5} more`)
    }
  })
  
  // Save detailed report to file
  const reportJson = JSON.stringify(auditReport, null, 2)
  fs.writeFileSync('audit-report.json', reportJson)
  console.log('\n✓ Detailed report saved to audit-report.json')
  
  // Generate SQL recommendations
  generateSQLRecommendations()
}

function generateSQLRecommendations() {
  console.log('\n💾 SQL RECOMMENDATIONS')
  console.log('─'.repeat(60))
  console.log('⚠️  DO NOT EXECUTE THESE YET - REVIEW FIRST!')
  console.log()
  
  const sqlStatements = []
  
  auditReport.issues.forEach(issue => {
    if (issue.category === 'LOCATION_INCONSISTENT') {
      sqlStatements.push(
        `-- Normalize location for incident ${issue.recordId}\n` +
        `UPDATE incidents SET location = '${issue.proposedValue.replace(/'/g, "''")}' WHERE id = '${issue.recordId}';`
      )
    } else if (issue.category === 'TEST_DATA' && issue.proposedValue !== 'DELETE or reassign to valid incident') {
      sqlStatements.push(
        `-- Replace test data in ${issue.table}.${issue.field} for record ${issue.recordId}\n` +
        `-- Current: ${issue.currentValue}\n` +
        `-- TODO: UPDATE ${issue.table} SET ${issue.field} = 'REALISTIC_VALUE_HERE' WHERE ${issue.table === 'case_documentations' ? 'incident_id' : 'id'} = '${issue.recordId}';`
      )
    } else if (issue.category === 'ORPHANED_RECORD') {
      sqlStatements.push(
        `-- Remove orphaned record from ${issue.table}\n` +
        `-- DELETE FROM ${issue.table} WHERE ${issue.table === 'case_documentations' ? 'incident_id' : 'id'} = '${issue.recordId}';`
      )
    }
  })
  
  const sqlFile = sqlStatements.join('\n\n')
  fs.writeFileSync('cleanup-recommendations.sql', sqlFile)
  console.log('✓ SQL recommendations saved to cleanup-recommendations.sql')
  console.log('\n⚠️  IMPORTANT: Review all SQL statements before executing!')
  console.log('⚠️  Backup your database first!')
}

// Main execution
async function main() {
  console.log('🔍 Starting LEIRS Database Audit (READ-ONLY)')
  console.log('=' .repeat(60))
  
  try {
    await auditIncidents()
    await auditCaseDocumentations()
    await auditDispatch()
    await auditEvidence()
    await auditPoliceStations()
    await auditCaseUpdates()
    await analyzeWorkflowConsistency()
    await generateReport()
    
    console.log('\n✅ Audit Complete!')
    console.log('\nNext Steps:')
    console.log('1. Review audit-report.json for detailed findings')
    console.log('2. Review cleanup-recommendations.sql')
    console.log('3. Backup your database')
    console.log('4. Execute approved SQL changes manually')
    console.log('5. Re-run audit to verify fixes')
    
  } catch (error) {
    console.error('\n❌ Audit failed:', error)
    process.exit(1)
  }
}

main()
