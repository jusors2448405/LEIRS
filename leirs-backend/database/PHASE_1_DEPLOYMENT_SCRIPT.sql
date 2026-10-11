-- ============================================================================
-- LEIRS PHASE 1 DEPLOYMENT SCRIPT
-- ============================================================================
-- Project: LEIRS-REVISE (kyvhyhmqwcxbloiliojw)
-- Date: 2026-09-30
-- Purpose: Deploy all Phase 1 database migrations in correct order
--
-- INSTRUCTIONS:
-- 1. Open Supabase Console: https://app.supabase.com/projects
-- 2. Select project: LEIRS-REVISE
-- 3. Navigate to SQL Editor
-- 4. Copy the entire contents of this file
-- 5. Paste into SQL Editor
-- 6. Click "RUN" or "Execute"
-- 7. Scroll down to see verification query results
--
-- ALL MIGRATIONS ARE IDEMPOTENT (safe to re-run):
-- - Uses "IF NOT EXISTS" for columns and indexes
-- - No DROPS or destructive operations
-- - No data modifications
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Add Complainant Details to Incidents Table
-- ============================================================================
-- File: 2026_09_30_add_complainant_details_to_incidents.sql
-- Purpose: Add complainant_email and complainant_address columns
-- Expected: 2 new columns added to incidents table
-- ============================================================================

ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS complainant_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS complainant_address TEXT;

CREATE INDEX IF NOT EXISTS idx_incidents_complainant_email 
  ON public.incidents(complainant_email) 
  WHERE complainant_email IS NOT NULL;

COMMENT ON COLUMN public.incidents.complainant_email 
  IS 'Complainant email address for notifications and case communications';
  
COMMENT ON COLUMN public.incidents.complainant_address 
  IS 'Complainant address for case documentation and official communications';

-- ============================================================================
-- MIGRATION 2: Add Respondent Address to Incidents Table
-- ============================================================================
-- File: 2026_09_30_add_respondent_address_to_incidents.sql
-- Purpose: Add respondent_address column (respondent_name/contact already exist)
-- Expected: 1 new column added to incidents table
-- NOTE: respondent_name and respondent_contact already exist from 2026_09_29
-- ============================================================================

ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS respondent_address TEXT;

CREATE INDEX IF NOT EXISTS idx_incidents_respondent_address 
  ON public.incidents(respondent_address) 
  WHERE respondent_address IS NOT NULL;

COMMENT ON COLUMN public.incidents.respondent_address 
  IS 'Denormalized respondent address for fast query performance (also stored in case_parties table); used for summons service and case documentation';

-- ============================================================================
-- MIGRATION 3: Add Workflow Tracking to Case Documentations Table
-- ============================================================================
-- File: 2026_09_30_add_workflow_tracking_to_case_documentations.sql
-- Purpose: Add current_stage and dispatch_required columns
-- Expected: 2 new columns added to case_documentations table
-- ============================================================================

ALTER TABLE public.case_documentations 
ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS dispatch_required BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_case_documentations_current_stage 
  ON public.case_documentations(current_stage) 
  WHERE current_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_case_documentations_dispatch_required 
  ON public.case_documentations(dispatch_required) 
  WHERE dispatch_required = TRUE;

COMMENT ON COLUMN public.case_documentations.current_stage 
  IS 'Current workflow stage (13-stage model): DOCUMENTED, PARTIES_IDENTIFIED, SUMMONS_ISSUED, HEARING_CONDUCTED, MEDIATION_ATTEMPTED, REFERRED_TO_PNP, DISPATCHED, OFFICER_ACTION, EVIDENCE_COLLECTED, CLOSED, etc. NULL for legacy cases.';

COMMENT ON COLUMN public.case_documentations.dispatch_required 
  IS 'Explicit flag set ONLY when case is referred to PNP in Resolution workflow. Controls visibility in Dispatch queue. FALSE (default) means case does not require dispatch.';

-- ============================================================================
-- VERIFICATION QUERIES - Run these after migrations complete
-- ============================================================================

-- ============================================================================
-- VERIFICATION 1: Check incidents table new columns
-- ============================================================================
-- Expected: Should show 3 rows (complainant_email, complainant_address, respondent_address)

SELECT 'incidents table - NEW COLUMNS' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
  AND column_name IN ('complainant_email', 'complainant_address', 'respondent_address')
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICATION 2: Check incidents table existing respondent columns
-- ============================================================================
-- Expected: Should show 2 rows (respondent_name, respondent_contact)
-- These should have existed from previous migration (2026_09_29)

SELECT 'incidents table - EXISTING RESPONDENT COLUMNS' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
  AND column_name IN ('respondent_name', 'respondent_contact')
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICATION 3: Check case_documentations table new columns
-- ============================================================================
-- Expected: Should show 2 rows (current_stage, dispatch_required)

SELECT 'case_documentations table - NEW COLUMNS' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'case_documentations'
  AND column_name IN ('current_stage', 'dispatch_required')
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICATION 4: List all indexes on incidents table
-- ============================================================================
-- Expected: Should include idx_incidents_complainant_email and idx_incidents_respondent_address

SELECT 'incidents table - INDEXES' as check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'incidents'
  AND indexname LIKE 'idx_incidents_%'
ORDER BY indexname;

-- ============================================================================
-- VERIFICATION 5: List all indexes on case_documentations table
-- ============================================================================
-- Expected: Should include idx_case_documentations_current_stage and idx_case_documentations_dispatch_required

SELECT 'case_documentations table - INDEXES' as check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'case_documentations'
  AND indexname LIKE 'idx_case_documentations_%'
ORDER BY indexname;

-- ============================================================================
-- VERIFICATION 6: Data integrity check - incidents record count
-- ============================================================================
-- Expected: Should return a number (count of all incidents)
-- Purpose: Verify no incidents were deleted or modified

SELECT 'INCIDENTS TABLE - RECORD COUNT' as check_name,
  COUNT(*) as total_incident_records
FROM public.incidents;

-- ============================================================================
-- VERIFICATION 7: Data integrity check - case_documentations record count
-- ============================================================================
-- Expected: Should return a number (count of all case documentation records)
-- Purpose: Verify no cases were deleted or modified

SELECT 'CASE_DOCUMENTATIONS TABLE - RECORD COUNT' as check_name,
  COUNT(*) as total_case_records
FROM public.case_documentations;

-- ============================================================================
-- VERIFICATION 8: Data integrity check - case_documentations new fields
-- ============================================================================
-- Expected: All should have dispatch_required = FALSE, current_stage = NULL
-- Purpose: Verify backward compatibility

SELECT 'CASE_DOCUMENTATIONS TABLE - DATA INTEGRITY' as check_name,
  COUNT(*) as total_cases,
  COUNT(CASE WHEN dispatch_required = FALSE THEN 1 END) as cases_with_dispatch_required_false,
  COUNT(CASE WHEN current_stage IS NULL THEN 1 END) as cases_with_current_stage_null
FROM public.case_documentations;

-- ============================================================================
-- VERIFICATION 9: Complete incidents table schema
-- ============================================================================
-- Purpose: Show all columns to verify nothing was dropped

SELECT 'incidents table - COMPLETE SCHEMA' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICATION 10: Complete case_documentations table schema
-- ============================================================================
-- Purpose: Show all columns to verify nothing was dropped

SELECT 'case_documentations table - COMPLETE SCHEMA' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'case_documentations'
ORDER BY ordinal_position;

-- ============================================================================
-- END OF PHASE 1 DEPLOYMENT SCRIPT
-- ============================================================================
-- If all verification queries show expected results:
-- ✅ Deployment successful
-- ✅ Ready to proceed to Phase 2 (Incident Data Flow)
-- ============================================================================
