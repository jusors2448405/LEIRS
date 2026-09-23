-- ═════════════════════════════════════════════════════════════════════════════
-- LEIRS DATABASE TEST DATA AUDIT
-- 
-- READ-ONLY: This script only queries data, makes no modifications
-- Purpose: Identify test/demo data before capstone defense cleanup
-- ═════════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 1: SUMMARY STATISTICS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ DATABASE SUMMARY ═══' as section,
  (SELECT COUNT(*) FROM incidents) as total_incidents,
  (SELECT COUNT(*) FROM case_documentations) as total_cases,
  (SELECT COUNT(*) FROM dispatch) as total_dispatches,
  (SELECT COUNT(*) FROM evidence) as total_evidence,
  (SELECT COUNT(*) FROM case_updates) as total_case_updates;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 2: IDENTIFY TEST/DEMO INCIDENTS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ A. CLEARLY TEST/DEMO DATA ═══' as section,
  i.id as incident_id,
  i.incident_number,
  i.incident_type,
  i.description,
  i.location,
  i.incident_date,
  i.status as incident_status,
  i.complainant_name,
  cd.id as case_id,
  cd.case_number,
  cd.case_title,
  cd.status as case_status,
  (SELECT COUNT(*) FROM dispatch WHERE incident_id = i.id) as dispatch_count,
  (SELECT COUNT(*) FROM evidence WHERE incident_id = i.id) as evidence_count,
  (SELECT COUNT(*) FROM case_updates WHERE case_id = cd.id) as case_update_count,
  CASE 
    WHEN (
      LOWER(i.description) LIKE '%test%' OR
      LOWER(i.description) LIKE '%demo%' OR
      LOWER(i.description) LIKE '%sample%'
    ) AND (
      LOWER(i.location) LIKE '%test%' OR
      LOWER(i.location) LIKE '%demo%' OR
      LOWER(i.location) LIKE '%sample%' OR
      LOWER(i.complainant_name) LIKE '%test%'
    ) THEN '✅ CLEARLY TEST (2+ indicators)'
    WHEN (
      LOWER(i.description) LIKE '%test%' OR
      LOWER(i.description) LIKE '%demo%' OR
      LOWER(i.location) LIKE '%test%' OR
      LOWER(i.complainant_name) LIKE '%test%'
    ) THEN '⚠️  POSSIBLY TEST (1 indicator)'
    ELSE '❌ KEEP (No test indicators)'
  END as classification,
  CASE 
    WHEN (SELECT COUNT(*) FROM dispatch WHERE incident_id = i.id) > 0 OR
         (SELECT COUNT(*) FROM evidence WHERE incident_id = i.id) > 0 OR
         (SELECT COUNT(*) FROM case_updates WHERE case_id = cd.id) > 0
    THEN '❌ HAS DEPENDENCIES'
    ELSE '✅ SAFE TO DELETE'
  END as deletion_safety
FROM incidents i
LEFT JOIN case_documentations cd ON cd.incident_id = i.id
WHERE 
  LOWER(i.description) LIKE '%test%' OR
  LOWER(i.description) LIKE '%demo%' OR
  LOWER(i.description) LIKE '%sample%' OR
  LOWER(i.location) LIKE '%test%' OR
  LOWER(i.location) LIKE '%demo%' OR
  LOWER(i.complainant_name) LIKE '%test%'
ORDER BY 
  CASE 
    WHEN (LOWER(i.description) LIKE '%test%' AND LOWER(i.location) LIKE '%test%') THEN 1
    ELSE 2
  END,
  i.created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 3: DETAILED DEPENDENCY ANALYSIS FOR EACH TEST INCIDENT
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ DEPENDENCY DETAILS ═══' as section,
  i.description as incident_description,
  i.id as incident_id,
  'Dispatch' as dependency_type,
  d.id as dependency_id,
  d.dispatch_status as status,
  ps.station_name as police_station,
  d.created_at
FROM incidents i
INNER JOIN dispatch d ON d.incident_id = i.id
LEFT JOIN police_stations ps ON ps.id = d.police_station_id
WHERE 
  LOWER(i.description) LIKE '%test%' OR
  LOWER(i.description) LIKE '%demo%' OR
  LOWER(i.location) LIKE '%test%'
UNION ALL
SELECT 
  '═══ DEPENDENCY DETAILS ═══' as section,
  i.description as incident_description,
  i.id as incident_id,
  'Evidence' as dependency_type,
  e.id as dependency_id,
  e.evidence_type as status,
  e.evidence_name as police_station,
  e.created_at
FROM incidents i
INNER JOIN evidence e ON e.incident_id = i.id
WHERE 
  LOWER(i.description) LIKE '%test%' OR
  LOWER(i.description) LIKE '%demo%' OR
  LOWER(i.location) LIKE '%test%'
UNION ALL
SELECT 
  '═══ DEPENDENCY DETAILS ═══' as section,
  i.description as incident_description,
  i.id as incident_id,
  'Case Update' as dependency_type,
  cu.id as dependency_id,
  cu.update_type as status,
  NULL as police_station,
  cu.created_at
FROM incidents i
INNER JOIN case_documentations cd ON cd.incident_id = i.id
INNER JOIN case_updates cu ON cu.case_id = cd.id
WHERE 
  LOWER(i.description) LIKE '%test%' OR
  LOWER(i.description) LIKE '%demo%' OR
  LOWER(i.location) LIKE '%test%'
ORDER BY incident_id, dependency_type, created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 4: HISTORICAL RECORDS (DO NOT DELETE)
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ D. HISTORICAL RECORDS (Keep) ═══' as section,
  i.id as incident_id,
  i.description as incident_description,
  i.status as incident_status,
  d.dispatch_status,
  ps.station_name,
  d.created_at as dispatch_date,
  'Has completed dispatch - Historical record' as reason
FROM incidents i
INNER JOIN dispatch d ON d.incident_id = i.id
LEFT JOIN police_stations ps ON ps.id = d.police_station_id
WHERE d.dispatch_status = 'Completed'
ORDER BY d.created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 5: FOREIGN KEY CONSTRAINTS CHECK
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ FOREIGN KEY CONSTRAINTS ═══' as section,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (
    tc.table_name IN ('incidents', 'case_documentations', 'dispatch', 'evidence', 'case_updates')
    OR ccu.table_name IN ('incidents', 'case_documentations', 'dispatch', 'evidence', 'case_updates')
  )
ORDER BY tc.table_name, kcu.column_name;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 6: CLEANUP PLAN (IDs ONLY - FOR REFERENCE)
-- ═════════════════════════════════════════════════════════════════════════════

-- Step 1: Identify incident IDs with test indicators
WITH test_incidents AS (
  SELECT i.id, i.description as incident_description
  FROM incidents i
  WHERE 
    LOWER(i.description) LIKE '%test%' OR
    LOWER(i.description) LIKE '%demo%' OR
    LOWER(i.description) LIKE '%sample%' OR
    LOWER(i.location) LIKE '%test%'
)
SELECT 
  '═══ CLEANUP PLAN - TEST INCIDENT IDS ═══' as section,
  ti.id as incident_id_to_delete,
  ti.incident_description,
  (SELECT COUNT(*) FROM case_updates cu 
   INNER JOIN case_documentations cd ON cd.id = cu.case_id 
   WHERE cd.incident_id = ti.id) as case_updates_to_delete,
  (SELECT COUNT(*) FROM evidence WHERE incident_id = ti.id) as evidence_to_delete,
  (SELECT COUNT(*) FROM dispatch WHERE incident_id = ti.id) as dispatches_to_delete,
  (SELECT COUNT(*) FROM case_documentations WHERE incident_id = ti.id) as cases_to_delete
FROM test_incidents ti
ORDER BY ti.incident_description;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 7: DELETION ORDER (REFERENCE ONLY - DO NOT EXECUTE YET)
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ PROPOSED DELETION ORDER ═══' as info,
  'Step 1: DELETE FROM case_updates WHERE case_id IN (SELECT id FROM case_documentations WHERE incident_id IN (...))' as step_1,
  'Step 2: DELETE FROM evidence WHERE incident_id IN (...)' as step_2,
  'Step 3: DELETE FROM dispatch WHERE incident_id IN (...)' as step_3,
  'Step 4: DELETE FROM case_documentations WHERE incident_id IN (...)' as step_4,
  'Step 5: DELETE FROM incidents WHERE id IN (...)' as step_5,
  '⚠️  DO NOT EXECUTE - WAIT FOR APPROVAL' as warning;

-- ═════════════════════════════════════════════════════════════════════════════
-- END OF AUDIT
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════════' as final_message;
SELECT '⚠️  AUDIT COMPLETE - READ-ONLY (No data modified)' as status;
SELECT 'Review results above and approve cleanup plan before executing deletions' as next_step;
SELECT '═══════════════════════════════════════════════════════════════════' as final_message_2;
