-- ═════════════════════════════════════════════════════════════════════════════
-- LEIRS POLICE STATION DATABASE UPDATE - OPTION B
-- Update mock stations with verified real police facilities
-- Date: August 25, 2026
-- Approved: 2 HIGH-confidence stations only
-- ═════════════════════════════════════════════════════════════════════════════

-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard (https://app.supabase.com)
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. Verify results in the police_stations table

-- ═════════════════════════════════════════════════════════════════════════════
-- STEP 1: Verify current state (READ ONLY - shows what will be updated)
-- ═════════════════════════════════════════════════════════════════════════════

-- Show current mock stations
SELECT 
  id,
  station_name,
  address,
  latitude,
  longitude,
  coverage_area,
  status
FROM public.police_stations
ORDER BY station_name;

-- Check dispatch records that reference these stations
SELECT 
  ps.station_name,
  COUNT(d.id) as dispatch_count
FROM public.police_stations ps
LEFT JOIN public.dispatch d ON d.police_station_id = ps.id
GROUP BY ps.id, ps.station_name
ORDER BY ps.station_name;

-- ═════════════════════════════════════════════════════════════════════════════
-- STEP 2: UPDATE Test Police Station Alpha → CCPS Sub-Station IV
-- ═════════════════════════════════════════════════════════════════════════════

UPDATE public.police_stations
SET 
  station_name = 'CCPS Sub-Station IV',
  address = 'Camarin Road, Hillcrest, North Caloocan City',
  latitude = 14.7508,
  longitude = 121.0383,
  coverage_area = 'Barangays 174-178, Camarin area, North Caloocan',
  contact_number = NULL,
  status = 'Available',
  updated_at = NOW()
WHERE station_name = 'Test Police Station Alpha';

-- Verify the update
SELECT 'UPDATE 1: Test Police Station Alpha → CCPS Sub-Station IV' as status,
       station_name, address, latitude, longitude
FROM public.police_stations
WHERE station_name = 'CCPS Sub-Station IV';

-- ═════════════════════════════════════════════════════════════════════════════
-- STEP 3: UPDATE Test Police Station Bravo → CCPS Sub-Station 11
-- ═════════════════════════════════════════════════════════════════════════════

UPDATE public.police_stations
SET 
  station_name = 'CCPS Sub-Station 11',
  address = 'Cadena De Amor Street, Barangay 174, Camarin, Caloocan City',
  latitude = 14.7626,
  longitude = 121.0483,
  coverage_area = 'Barangay 174 and adjacent areas, Camarin, North Caloocan',
  contact_number = NULL,
  status = 'Available',
  updated_at = NOW()
WHERE station_name = 'Test Police Station Bravo';

-- Verify the update
SELECT 'UPDATE 2: Test Police Station Bravo → CCPS Sub-Station 11' as status,
       station_name, address, latitude, longitude
FROM public.police_stations
WHERE station_name = 'CCPS Sub-Station 11';

-- ═════════════════════════════════════════════════════════════════════════════
-- STEP 4: Keep Test Police Station Charlie (MEDIUM-HIGH confidence - not approved)
-- ═════════════════════════════════════════════════════════════════════════════

-- DO NOTHING - Test Police Station Charlie remains as placeholder
-- Reason: User selected Option B (HIGH-confidence stations only)

SELECT 'RETAINED: Test Police Station Charlie (awaiting verification)' as status,
       station_name, address, latitude, longitude
FROM public.police_stations
WHERE station_name = 'Test Police Station Charlie';

-- ═════════════════════════════════════════════════════════════════════════════
-- STEP 5: FINAL VERIFICATION - Show all police stations after update
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  CASE 
    WHEN station_name LIKE 'CCPS Sub-Station%' THEN '✅ VERIFIED'
    WHEN station_name LIKE 'Test%' THEN '⏸️ MOCK'
    ELSE '❓ UNKNOWN'
  END as verification_status,
  station_name,
  address,
  latitude,
  longitude,
  coverage_area,
  contact_number,
  status,
  updated_at
FROM public.police_stations
ORDER BY 
  CASE WHEN station_name LIKE 'CCPS%' THEN 1 ELSE 2 END,
  station_name;

-- ═════════════════════════════════════════════════════════════════════════════
-- STEP 6: Verify foreign key relationships are intact
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  ps.station_name,
  d.id as dispatch_id,
  d.dispatch_status,
  d.created_at
FROM public.police_stations ps
INNER JOIN public.dispatch d ON d.police_station_id = ps.id
ORDER BY ps.station_name, d.created_at DESC
LIMIT 20;

-- ═════════════════════════════════════════════════════════════════════════════
-- UPDATE SUMMARY
-- ═════════════════════════════════════════════════════════════════════════════

-- If all queries above executed successfully:
-- ✅ 2 mock stations updated with verified real facilities
-- ✅ 1 mock station retained (awaiting additional verification)
-- ✅ All UUIDs preserved (foreign keys intact)
-- ✅ Historical dispatch data unchanged

-- VERIFICATION DETAILS:
-- 
-- CCPS Sub-Station IV:
--   • Source: Official CCPS Directory (Scribd Doc 567071571)
--   • Coordinates: Wikimedia Commons verified geographic data
--   • Confidence: HIGH
--
-- CCPS Sub-Station 11:
--   • Source: Official PNP Documentation (Scribd Doc 979601919)
--   • Coordinates: MapQuest + multiple corroborating sources
--   • Confidence: HIGH
--
-- Test Police Station Charlie:
--   • Status: Retained as placeholder
--   • Reason: CCPS NEO Barugo (MEDIUM-HIGH confidence) not approved in Option B
--
-- Full verification report: POLICE_STATION_VERIFICATION_REPORT_v2.md

-- ═════════════════════════════════════════════════════════════════════════════
-- END OF UPDATE SCRIPT
-- ═════════════════════════════════════════════════════════════════════════════
