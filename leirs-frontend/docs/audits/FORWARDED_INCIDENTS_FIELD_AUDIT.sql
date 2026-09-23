-- ═════════════════════════════════════════════════════════════════════════════
-- FORWARDED INCIDENTS FIELD MAPPING AUDIT (READ-ONLY)
-- 
-- Purpose: Compare field mappings between Incident List and Forwarded Incidents
-- ═════════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 1: FIND THE SPECIFIC INCIDENT (LEIRS-2026-0922-602)
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ SPECIFIC INCIDENT: LEIRS-2026-0922-602 ═══' as section,
  id,
  incident_number,                    -- Should display as "Reference #"
  incident_type,                      -- Should display as "Incident Type"
  incident_date,                      -- Should display as "Date"
  incident_time,                      -- Should display as "Time"
  location,                           -- Should display as "Location"
  complainant_name,                   -- Should display as "Reporter/Complainant"
  complainant_contact,                -- Should display as contact
  status,                             -- Should display as "Status"
  created_at,                         -- Submission/encoding timestamp
  updated_at
FROM incidents
WHERE incident_number = 'LEIRS-2026-0922-602'
LIMIT 1;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 2: CHECK ALL "UNDER INVESTIGATION" INCIDENTS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ ALL "UNDER INVESTIGATION" INCIDENTS ═══' as section,
  id,
  incident_number,                    -- Maps to "Reference #"
  incident_type,
  incident_date,                      -- Maps to "Date"
  incident_time,                      -- Maps to "Time"
  location,                           -- Maps to "Location"
  complainant_name,                   -- Maps to "Complainant"
  status,
  created_at,
  CASE 
    WHEN incident_number IS NULL THEN '❌ incident_number is NULL'
    ELSE '✅ incident_number EXISTS'
  END as incident_number_check,
  CASE 
    WHEN incident_date IS NULL THEN '❌ incident_date is NULL'
    ELSE '✅ incident_date EXISTS'
  END as incident_date_check,
  CASE 
    WHEN incident_time IS NULL THEN '⚠️  incident_time is NULL'
    ELSE '✅ incident_time EXISTS'
  END as incident_time_check,
  CASE 
    WHEN location IS NULL OR location = '' THEN '❌ location is NULL/empty'
    ELSE '✅ location EXISTS'
  END as location_check
FROM incidents
WHERE status = 'Under Investigation'
ORDER BY created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 3: CHECK ALL "PENDING" INCIDENTS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ ALL "PENDING" INCIDENTS ═══' as section,
  id,
  incident_number,
  incident_type,
  incident_date,
  incident_time,
  location,
  complainant_name,
  status,
  created_at,
  CASE 
    WHEN incident_number IS NULL THEN '❌ incident_number is NULL'
    ELSE '✅ incident_number EXISTS'
  END as incident_number_check,
  CASE 
    WHEN location IS NULL OR location = '' THEN '❌ location is NULL/empty'
    ELSE '✅ location EXISTS'
  END as location_check
FROM incidents
WHERE status = 'Pending'
ORDER BY created_at DESC
LIMIT 10;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 4: CHECK FOR INCIDENTS WITH MISNAMED COLUMNS (SHOULD BE EMPTY)
-- ═════════════════════════════════════════════════════════════════════════════

-- This query will FAIL if these columns don't exist (which is expected)
-- If it succeeds, these columns DO exist and are causing confusion

-- Uncomment to test (expect error):
-- SELECT incident_reference_number FROM incidents LIMIT 1;
-- SELECT location_barangay FROM incidents LIMIT 1;
-- SELECT location_municipality FROM incidents LIMIT 1;

SELECT '═══ COLUMN EXISTENCE CHECK ═══' as section;

-- Check which columns actually exist in the incidents table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'incidents'
  AND column_name IN (
    'incident_number',
    'incident_reference_number',
    'incident_date',
    'incident_time',
    'location',
    'location_barangay',
    'location_municipality',
    'complainant_name',
    'created_at'
  )
ORDER BY 
  CASE column_name
    WHEN 'incident_number' THEN 1
    WHEN 'incident_reference_number' THEN 2
    WHEN 'incident_date' THEN 3
    WHEN 'incident_time' THEN 4
    WHEN 'location' THEN 5
    WHEN 'location_barangay' THEN 6
    WHEN 'location_municipality' THEN 7
    WHEN 'complainant_name' THEN 8
    WHEN 'created_at' THEN 9
    ELSE 10
  END;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 5: SAMPLE 5 RECENT INCIDENTS (ANY STATUS)
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ 5 MOST RECENT INCIDENTS (ALL STATUSES) ═══' as section,
  incident_number,
  incident_type,
  incident_date,
  incident_time,
  location,
  complainant_name,
  status,
  created_at,
  -- Show formatted timestamps
  to_char(incident_date, 'Mon DD, YYYY') as formatted_date,
  to_char(created_at, 'Mon DD, YYYY HH24:MI') as formatted_created_at
FROM incidents
ORDER BY created_at DESC
LIMIT 5;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 6: CHECK IF incident_time IS COMMONLY NULL
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ incident_time NULL ANALYSIS ═══' as section,
  COUNT(*) as total_incidents,
  COUNT(incident_time) as incidents_with_time,
  COUNT(*) - COUNT(incident_time) as incidents_without_time,
  ROUND((COUNT(*) - COUNT(incident_time)) * 100.0 / COUNT(*), 2) as percent_without_time
FROM incidents;

-- ═════════════════════════════════════════════════════════════════════════════
-- END OF AUDIT
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════════' as final_message;
SELECT '⚠️  AUDIT COMPLETE - READ-ONLY (No data modified)' as status;
SELECT 'Compare results with ForwardedIncidents.jsx display' as next_step;
SELECT '═══════════════════════════════════════════════════════════════════' as final_message_2;
