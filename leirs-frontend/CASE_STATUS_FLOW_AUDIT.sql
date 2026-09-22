-- ═════════════════════════════════════════════════════════════════════════════
-- LEIRS CASE STATUS FLOW AUDIT (READ-ONLY)
-- 
-- Purpose: Trace actual case status flow to identify premature status assignment
-- ═════════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 1: DATABASE SUMMARY
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ DATABASE SUMMARY ═══' as section,
  (SELECT COUNT(*) FROM incidents) as total_incidents,
  (SELECT COUNT(*) FROM case_documentations) as total_cases,
  (SELECT COUNT(*) FROM dispatch) as total_dispatches,
  (SELECT COUNT(*) FROM evidence) as total_evidence;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 2: STATUS DISTRIBUTION - INCIDENTS TABLE
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ INCIDENTS STATUS DISTRIBUTION ═══' as section,
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM incidents), 2) as percentage
FROM incidents
GROUP BY status
ORDER BY count DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 3: STATUS DISTRIBUTION - CASE DOCUMENTATIONS TABLE
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ CASE DOCUMENTATIONS STATUS DISTRIBUTION ═══' as section,
  case_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM case_documentations), 2) as percentage
FROM case_documentations
GROUP BY case_status
ORDER BY count DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 4: TRACE COMPLETE RECORD LIFECYCLE (SAMPLE 20 RECENT)
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ COMPLETE RECORD LIFECYCLE (20 MOST RECENT) ═══' as section,
  i.id as incident_id,
  i.incident_number,
  i.incident_type,
  i.status as incident_status,
  i.created_at as incident_created,
  cd.id as case_id,
  cd.case_number,
  cd.case_status as case_doc_status,
  cd.created_at as case_created,
  d.id as dispatch_id,
  d.dispatch_number,
  d.dispatch_status,
  d.station_response_status,
  d.created_at as dispatch_created,
  ps.station_name,
  e.id as evidence_id,
  e.evidence_name,
  e.created_at as evidence_created,
  CASE 
    WHEN cd.id IS NULL THEN '1_NO_CASE_DOC'
    WHEN d.id IS NULL THEN '2_NO_DISPATCH'
    WHEN e.id IS NULL THEN '3_NO_EVIDENCE'
    ELSE '4_COMPLETE'
  END as workflow_stage
FROM incidents i
LEFT JOIN case_documentations cd ON cd.incident_id = i.id
LEFT JOIN dispatch d ON d.incident_id = i.id
LEFT JOIN police_stations ps ON ps.id = d.police_station_id
LEFT JOIN evidence e ON e.incident_id = i.id
ORDER BY i.created_at DESC
LIMIT 20;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 5: IDENTIFY STATUS MISMATCHES
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ STATUS MISMATCH: INCIDENT vs CASE DOC ═══' as section,
  i.incident_number,
  i.status as incident_status,
  cd.case_status as case_doc_status,
  i.created_at as incident_created,
  cd.created_at as case_created,
  CASE 
    WHEN i.status != cd.case_status THEN '❌ MISMATCH'
    ELSE '✅ MATCH'
  END as sync_status
FROM incidents i
INNER JOIN case_documentations cd ON cd.incident_id = i.id
WHERE i.status != cd.case_status
ORDER BY i.created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 6: IDENTIFY "READY FOR DISPATCH" INCIDENTS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ INCIDENTS WITH "READY FOR DISPATCH" STATUS ═══' as section,
  i.incident_number,
  i.incident_type,
  i.status as incident_status,
  i.created_at as incident_created,
  cd.case_number,
  cd.case_status as case_doc_status,
  cd.created_at as case_created,
  d.dispatch_number,
  d.dispatch_status,
  d.created_at as dispatch_created,
  CASE 
    WHEN cd.id IS NULL THEN '❌ NO CASE DOC (should not be For Mediation)'
    WHEN d.id IS NULL THEN '✅ Awaiting Dispatch (correct)'
    ELSE '⚠️  Already Dispatched'
  END as validation
FROM incidents i
LEFT JOIN case_documentations cd ON cd.incident_id = i.id
LEFT JOIN dispatch d ON d.incident_id = i.id
WHERE i.status = 'For Mediation' OR cd.case_status = 'For Mediation'
ORDER BY i.created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 7: IDENTIFY "UNDER INVESTIGATION" INCIDENTS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ INCIDENTS WITH "UNDER INVESTIGATION" STATUS ═══' as section,
  i.incident_number,
  i.incident_type,
  i.status as incident_status,
  i.created_at as incident_created,
  cd.case_number,
  cd.case_status as case_doc_status,
  cd.created_at as case_created,
  d.dispatch_number,
  d.dispatch_status,
  d.officer_name,
  d.created_at as dispatch_created,
  CASE 
    WHEN cd.id IS NULL THEN '❌ NO CASE DOC (premature Under Investigation)'
    WHEN d.id IS NULL THEN '❌ NO DISPATCH (premature Under Investigation)'
    WHEN d.dispatch_status NOT IN ('Officer Assigned', 'Dispatched', 'Responding', 'On Scene', 'Completed') 
      THEN '⚠️  Dispatch not active yet'
    ELSE '✅ Valid Under Investigation'
  END as validation
FROM incidents i
LEFT JOIN case_documentations cd ON cd.incident_id = i.id
LEFT JOIN dispatch d ON d.incident_id = i.id
WHERE i.status = 'Under Investigation' OR cd.case_status = 'Under Investigation'
ORDER BY i.created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 8: NEWLY SUBMITTED INCIDENTS (LAST 24 HOURS)
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ NEWLY SUBMITTED INCIDENTS (LAST 24 HOURS) ═══' as section,
  i.incident_number,
  i.incident_type,
  i.status as incident_status,
  i.created_at as incident_created,
  cd.case_number,
  cd.case_status as case_doc_status,
  cd.created_at as case_created,
  d.dispatch_status,
  d.created_at as dispatch_created,
  CASE 
    WHEN cd.id IS NULL AND i.status = 'Pending' THEN '✅ CORRECT (Pending, no case doc)'
    WHEN cd.id IS NULL AND i.status != 'Pending' THEN '❌ WRONG (Non-Pending without case doc)'
    WHEN cd.id IS NOT NULL AND cd.case_status = 'Pending' THEN '✅ CORRECT (Has case doc, Pending)'
    WHEN cd.id IS NOT NULL AND cd.case_status != 'Pending' THEN '⚠️  CHECK (Non-Pending case doc)'
    ELSE '? UNKNOWN'
  END as validation
FROM incidents i
LEFT JOIN case_documentations cd ON cd.incident_id = i.id
LEFT JOIN dispatch d ON d.incident_id = i.id
WHERE i.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY i.created_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 9: CHECK FOR DATABASE TRIGGERS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ DATABASE TRIGGERS ═══' as section,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('incidents', 'case_documentations', 'dispatch', 'evidence')
ORDER BY event_object_table, trigger_name;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 10: CHECK FOR FUNCTIONS THAT MIGHT AUTO-UPDATE STATUS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT 
  '═══ FUNCTIONS THAT MIGHT AUTO-UPDATE STATUS ═══' as section,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%status%' OR
    routine_name LIKE '%incident%' OR
    routine_name LIKE '%case%' OR
    routine_name LIKE '%dispatch%'
  )
ORDER BY routine_name;

-- ═════════════════════════════════════════════════════════════════════════════
-- END OF AUDIT
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════════' as final_message;
SELECT '⚠️  AUDIT COMPLETE - READ-ONLY (No data modified)' as status;
SELECT 'Review results to identify status flow issues' as next_step;
SELECT '═══════════════════════════════════════════════════════════════════' as final_message_2;
