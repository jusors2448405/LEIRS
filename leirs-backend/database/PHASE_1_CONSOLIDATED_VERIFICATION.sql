-- ============================================================================
-- PHASE 1 CONSOLIDATED VERIFICATION QUERY
-- ============================================================================
-- Runs all verification checks in a single query output
-- Copy and paste into Supabase SQL Editor and run
-- ============================================================================

-- ============================================================================
-- SECTION 1: Verify incidents table columns exist
-- ============================================================================
SELECT 
  '=== SECTION 1: incidents TABLE - COLUMN VERIFICATION ===' as verification_section,
  'NEW: complainant_email' as check_item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='complainant_email') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  'VARCHAR(255), nullable' as expected_type
UNION ALL
SELECT 
  '=== SECTION 1: incidents TABLE - COLUMN VERIFICATION ===',
  'NEW: complainant_address',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='complainant_address') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'TEXT, nullable'
UNION ALL
SELECT 
  '=== SECTION 1: incidents TABLE - COLUMN VERIFICATION ===',
  'EXISTING: respondent_name',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='respondent_name') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'TEXT, nullable'
UNION ALL
SELECT 
  '=== SECTION 1: incidents TABLE - COLUMN VERIFICATION ===',
  'EXISTING: respondent_contact',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='respondent_contact') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'TEXT, nullable'
UNION ALL
SELECT 
  '=== SECTION 1: incidents TABLE - COLUMN VERIFICATION ===',
  'NEW: respondent_address',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='respondent_address') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'TEXT, nullable'

UNION ALL
-- ============================================================================
-- SECTION 2: Verify case_documentations table columns exist
-- ============================================================================
SELECT 
  '=== SECTION 2: case_documentations TABLE - COLUMN VERIFICATION ===',
  'NEW: current_stage',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_documentations' AND column_name='current_stage') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'VARCHAR(50), nullable'
UNION ALL
SELECT 
  '=== SECTION 2: case_documentations TABLE - COLUMN VERIFICATION ===',
  'NEW: dispatch_required',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_documentations' AND column_name='dispatch_required') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'BOOLEAN, default FALSE'

UNION ALL
-- ============================================================================
-- SECTION 3: Verify indexes exist
-- ============================================================================
SELECT 
  '=== SECTION 3: INDEXES - VERIFICATION ===',
  'Index: idx_incidents_complainant_email',
  CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='incidents' AND indexname='idx_incidents_complainant_email') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'On incidents(complainant_email)'
UNION ALL
SELECT 
  '=== SECTION 3: INDEXES - VERIFICATION ===',
  'Index: idx_incidents_respondent_address',
  CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='incidents' AND indexname='idx_incidents_respondent_address') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'On incidents(respondent_address)'
UNION ALL
SELECT 
  '=== SECTION 3: INDEXES - VERIFICATION ===',
  'Index: idx_case_documentations_current_stage',
  CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='case_documentations' AND indexname='idx_case_documentations_current_stage') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'On case_documentations(current_stage)'
UNION ALL
SELECT 
  '=== SECTION 3: INDEXES - VERIFICATION ===',
  'Index: idx_case_documentations_dispatch_required',
  CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='case_documentations' AND indexname='idx_case_documentations_dispatch_required') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END,
  'On case_documentations(dispatch_required)'

UNION ALL
-- ============================================================================
-- SECTION 4: Record counts (verify data not modified)
-- ============================================================================
SELECT 
  '=== SECTION 4: RECORD COUNTS - DATA INTEGRITY ===',
  'Total incidents records',
  CAST(COUNT(*) AS TEXT),
  'incidents table'
FROM public.incidents

UNION ALL
SELECT 
  '=== SECTION 4: RECORD COUNTS - DATA INTEGRITY ===',
  'Total case_documentations records',
  CAST(COUNT(*) AS TEXT),
  'case_documentations table'
FROM public.case_documentations

UNION ALL
-- ============================================================================
-- SECTION 5: Data integrity verification
-- ============================================================================
SELECT 
  '=== SECTION 5: DATA INTEGRITY - BACKWARD COMPATIBILITY ===',
  'Existing cases with dispatch_required = FALSE',
  CAST(COUNT(*) AS TEXT),
  'Should be equal to total case_documentations'
FROM public.case_documentations
WHERE dispatch_required = FALSE

UNION ALL
SELECT 
  '=== SECTION 5: DATA INTEGRITY - BACKWARD COMPATIBILITY ===',
  'Existing cases with current_stage IS NOT NULL',
  CAST(COUNT(*) AS TEXT),
  'Should be 0 (legacy cases have NULL)'
FROM public.case_documentations
WHERE current_stage IS NOT NULL

UNION ALL
SELECT 
  '=== SECTION 5: DATA INTEGRITY - BACKWARD COMPATIBILITY ===',
  'Existing cases with dispatch_required = TRUE',
  CAST(COUNT(*) AS TEXT),
  'Should be 0 (no explicit PNP referrals yet)'
FROM public.case_documentations
WHERE dispatch_required = TRUE

UNION ALL
-- ============================================================================
-- SECTION 6: RLS Policy verification (did not modify)
-- ============================================================================
SELECT 
  '=== SECTION 6: RLS POLICIES - VERIFICATION ===',
  'RLS policies on incidents table',
  CAST(COUNT(*) AS TEXT),
  'Should be unchanged from before Phase 1'
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'incidents'

UNION ALL
SELECT 
  '=== SECTION 6: RLS POLICIES - VERIFICATION ===',
  'RLS policies on case_documentations table',
  CAST(COUNT(*) AS TEXT),
  'Should be unchanged from before Phase 1'
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'case_documentations'

UNION ALL
SELECT 
  '=== SECTION 6: RLS POLICIES - VERIFICATION ===',
  'RLS policies on case_parties table',
  CAST(COUNT(*) AS TEXT),
  'Should be unchanged'
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'case_parties'

UNION ALL
SELECT 
  '=== SECTION 6: RLS POLICIES - VERIFICATION ===',
  'RLS policies on case_summons table',
  CAST(COUNT(*) AS TEXT),
  'Should be unchanged'
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'case_summons'

UNION ALL
SELECT 
  '=== SECTION 6: RLS POLICIES - VERIFICATION ===',
  'RLS policies on barangay_hearings table',
  CAST(COUNT(*) AS TEXT),
  'Should be unchanged'
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'barangay_hearings'

UNION ALL
SELECT 
  '=== SECTION 6: RLS POLICIES - VERIFICATION ===',
  'RLS policies on mediation_records table',
  CAST(COUNT(*) AS TEXT),
  'Should be unchanged'
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'mediation_records'

UNION ALL
-- ============================================================================
-- SECTION 7: FINAL STATUS
-- ============================================================================
SELECT 
  '=== SECTION 7: FINAL DEPLOYMENT STATUS ===',
  'Phase 1 Deployment',
  CASE WHEN 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='complainant_email') AND
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='complainant_address') AND
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='respondent_address') AND
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_documentations' AND column_name='current_stage') AND
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='case_documentations' AND column_name='dispatch_required')
  THEN '✅ SUCCESSFUL' ELSE '❌ INCOMPLETE' END,
  'All 5 new columns deployed'

ORDER BY verification_section, check_item;

-- ============================================================================
-- END OF CONSOLIDATED VERIFICATION QUERY
-- ============================================================================
