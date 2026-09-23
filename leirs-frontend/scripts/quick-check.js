import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://kyvhyhmqwcxbloiliojw.supabase.co',
  'sb_publishable_17FzwGTxf5fon1MFiTNtUA_COCWk1P6'
)

const { data } = await supabase.from('police_stations').select('station_name, address').order('station_name')
console.log('\nCurrent stations:')
data.forEach(s => console.log(`- ${s.station_name}`))
