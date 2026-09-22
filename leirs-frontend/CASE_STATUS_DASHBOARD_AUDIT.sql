-- ═════════════════════════════════════════════════════════════════════════════
-- CASE STATUS DASHBOARD AUDIT (READ-ONLY)
-- 
-- Purpose: Compare dashboard counters with actual database values
-- ═════════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 1: ACTUAL DATABASE COUNTS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 1: CASE DOCUMENTATION STATUS COUNTS ═══' as section;

SELECT 
  case_status,
  COUNT(*) as count
FROM case_documentations
GROUP BY case_status
ORDER BY 
  CASE case_status
    WHEN 'Pending' THEN 1
    WHEN 'Under Investigation' THEN 2
    WHEN 'For Mediation' THEN 3
    WHEN 'Resolved' THEN 4
    WHEN 'Closed' THEN 5
    ELSE 6
  END;

-- Total count
SELECT 
  '═══ TOTAL CASES ═══' as metric,
  COUNT(*) as count
FROM case_documentations;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 2: DISPATCH STATUS COUNTS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 2: DISPATCH STATUS COUNTS ═══' as section;

SELECT 
  dispatch_status,
  COUNT(*) as count
FROM dispatch
GROUP BY dispatch_status
ORDER BY count DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 3: DISPATCHED vs NOT DISPATCHED CASES
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 3: DISPATCHED vs NOT DISPATCHED ═══' as section;

-- Count cases with dispatch records
SELECT 
  'Cases with Dispatch Records' as category,
  COUNT(DISTINCT cd.id) as count
FROM case_documentations cd
INNER JOIN dispatch d ON d.incident_id = cd.incident_id;

-- Count cases with "For Mediation" status
SELECT 
  'Cases with "For Mediation" status' as category,
  COUNT(*) as count
FROM case_documentations
WHERE case_status = 'For Mediation';

-- Count cases with "For Mediation" status AND dispatch record
SELECT 
  'Cases with "For Mediation" AND Dispatch' as category,
  COUNT(DISTINCT cd.id) as count
FROM case_documentations cd
INNER JOIN dispatch d ON d.incident_id = cd.incident_id
WHERE cd.case_status = 'For Mediation';

-- Count cases with "For Mediation" status but NO dispatch record
SELECT 
  'Cases with "For Mediation" NO Dispatch (should show in counter)' as category,
  COUNT(*) as count
FROM case_documentations cd
WHERE cd.case_status = 'For Mediation'
  AND NOT EXISTS (
    SELECT 1 FROM dispatch d WHERE d.incident_id = cd.incident_id
  );

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 4: DASHBOARD COUNTER CALCULATION VERIFICATION
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 4: EXPECTED DASHBOARD COUNTERS ═══' as section;

WITH stats AS (
  SELECT 
    COUNT(*) as total_cases,
    SUM(CASE WHEN case_status = 'Pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN case_status = 'Under Investigation' THEN 1 ELSE 0 END) as under_investigation,
    SUM(CASE WHEN case_status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
    SUM(CASE WHEN case_status = 'Closed' THEN 1 ELSE 0 END) as closed,
    -- Ready for Dispatch: "For Mediation" cases that have NOT been dispatched
    SUM(
      CASE 
        WHEN case_status = 'For Mediation' 
         AND NOT EXISTS (SELECT 1 FROM dispatch WHERE incident_id = case_documentations.incident_id)
        THEN 1 
        ELSE 0 
      END
    ) as ready_for_dispatch
  FROM case_documentations
)
SELECT 
  'Total Cases' as counter,
  total_cases as value
FROM stats
UNION ALL
SELECT 
  'Active Cases (Total - Closed)',
  total_cases - closed
FROM stats
UNION ALL
SELECT 
  'Dispatched Cases (Ready for Dispatch)',
  ready_for_dispatch
FROM stats
UNION ALL
SELECT 
  'Under Investigation',
  under_investigation
FROM stats
UNION ALL
SELECT 
  'Resolved',
  resolved
FROM stats
UNION ALL
SELECT 
  'Closed',
  closed
FROM stats;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 5: RECENTLY UPDATED CASES (WHAT DASHBOARD SHOWS)
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 5: RECENTLY UPDATED CASES (TOP 5) ═══' as section;

SELECT 
  cd.case_number,
  cd.case_status as case_doc_status,
  i.incident_number,
  i.incident_type,
  i.location,
  d.dispatch_status,
  d.officer_name,
  cd.updated_at,
  CASE 
    WHEN cd.case_status IN ('Resolved', 'Closed') THEN cd.case_status
    WHEN d.dispatch_status IS NOT NULL THEN d.dispatch_status
    ELSE cd.case_status
  END as effective_status
FROM case_documentations cd
INNER JOIN incidents i ON i.id = cd.incident_id
LEFT JOIN dispatch d ON d.incident_id = cd.incident_id
ORDER BY cd.updated_at DESC
LIMIT 5;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 6: STATUS MISMATCHES
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 6: STATUS MISMATCHES ═══' as section;

-- Cases with dispatch records but case_status not updated
SELECT 
  cd.case_number,
  cd.case_status as case_doc_status,
  d.dispatch_status,
  i.incident_number,
  'Case has dispatch but status may not reflect workflow' as issue
FROM case_documentations cd
INNER JOIN dispatch d ON d.incident_id = cd.incident_id
INNER JOIN incidents i ON i.id = cd.incident_id
WHERE d.dispatch_status IN ('Officer Assigned', 'Dispatched', 'Responding', 'On Scene', 'Completed')
  AND cd.case_status NOT IN ('Resolved', 'Closed')
ORDER BY cd.updated_at DESC;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 7: ACTIVE CASES CALCULATION
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 7: ACTIVE vs CLOSED BREAKDOWN ═══' as section;

SELECT 
  CASE 
    WHEN case_status = 'Closed' THEN 'Closed'
    ELSE 'Active'
  END as category,
  case_status,
  COUNT(*) as count
FROM case_documentations
GROUP BY 
  CASE 
    WHEN case_status = 'Closed' THEN 'Closed'
    ELSE 'Active'
  END,
  case_status
ORDER BY category, case_status;

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 8: CHECK FOR ORPHANED RECORDS
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 8: DATA CONSISTENCY CHECKS ═══' as section;

-- Check for dispatch records without case documentation
SELECT 
  'Dispatch records without case documentation' as check_type,
  COUNT(*) as count
FROM dispatch d
WHERE NOT EXISTS (
  SELECT 1 FROM case_documentations cd WHERE cd.incident_id = d.incident_id
);

-- Check for case documentations without incidents
SELECT 
  'Case documentations without incidents' as check_type,
  COUNT(*) as count
FROM case_documentations cd
WHERE NOT EXISTS (
  SELECT 1 FROM incidents i WHERE i.id = cd.incident_id
);

-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION 9: SAMPLE COMPLETE CASE TRACES
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══ SECTION 9: SAMPLE COMPLETE CASE TRACES ═══' as section;

SELECT 
  i.incident_number,
  i.status as incident_status,
  cd.case_number,
  cd.case_status as case_doc_status,
  d.dispatch_status,
  d.officer_name,
  d.dispatched_at,
  CASE 
    WHEN cd.case_status IN ('Resolved', 'Closed') THEN 'Final State: ' || cd.case_status
    WHEN d.dispatch_status IS NOT NULL THEN 'Active Dispatch: ' || d.dispatch_status
    WHEN cd.case_status = 'For Mediation' AND d.id IS NULL THEN 'Ready for Dispatch (Not yet dispatched)'
    WHEN cd.case_status = 'Under Investigation' THEN 'Under Investigation (No dispatch yet)'
    WHEN cd.case_status = 'Pending' THEN 'Pending (Awaiting case handling)'
    ELSE 'Unknown State'
  END as workflow_stage
FROM incidents i
INNER JOIN case_documentations cd ON cd.incident_id = i.id
LEFT JOIN dispatch d ON d.incident_id = i.id
ORDER BY cd.updated_at DESC
LIMIT 10;

-- ═════════════════════════════════════════════════════════════════════════════
-- END OF AUDIT
-- ═════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════════' as final_message;
SELECT '⚠️  AUDIT COMPLETE - READ-ONLY (No data modified)' as status;
SELECT 'Compare results with dashboard display' as next_step;
SELECT '═══════════════════════════════════════════════════════════════════' as final_message_2;
