import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://kyvhyhmqwcxbloiliojw.supabase.co',
  'sb_publishable_17FzwGTxf5fon1MFiTNtUA_COCWk1P6'
)

console.log('Fetching incidents...\n')

const { data: incidents } = await supabase.from('incidents').select('id, incident_title, incident_type, location, status, reported_by, created_at').order('created_at', { ascending: false })

console.log(`Total incidents: ${incidents.length}\n`)

for (const inc of incidents) {
  const title = inc.incident_title?.toLowerCase() || ''
  const location = inc.location?.toLowerCase() || ''
  const reporter = inc.reported_by?.toLowerCase() || ''
  
  const hasTest = title.includes('test') || location.includes('test') || reporter.includes('test') ||
                  title.includes('demo') || location.includes('demo') ||
                  title.includes('sample')
  
  if (hasTest) {
    console.log(`⚠️  TEST DATA: ${inc.incident_title}`)
    console.log(`   ID: ${inc.id}`)
    console.log(`   Type: ${inc.incident_type}`)
    console.log(`   Location: ${inc.location}`)
    console.log(`   Status: ${inc.status}`)
    console.log(`   Reporter: ${inc.reported_by}`)
    console.log('')
    
    // Check dependencies
    const { data: cases } = await supabase.from('case_documentations').select('id').eq('incident_id', inc.id)
    const { data: dispatches } = await supabase.from('dispatch').select('id, dispatch_status').eq('incident_id', inc.id)
    const { data: evidence } = await supabase.from('evidence').select('id').eq('incident_id', inc.id)
    
    console.log(`   Dependencies:`)
    console.log(`     Cases: ${cases?.length || 0}`)
    console.log(`     Dispatches: ${dispatches?.length || 0}`)
    console.log(`     Evidence: ${evidence?.length || 0}`)
    console.log('')
  }
}

console.log('Audit complete.')
