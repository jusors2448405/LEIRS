-- ============================================================================
-- LEIRS WORKFLOW ENHANCEMENT - ADD WORKFLOW TRACKING TO CASE_DOCUMENTATIONS
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-30
-- Project: LEIRS REVISE
-- Purpose: Add workflow stage tracking and dispatch control flags to case_documentations table
--
-- SCOPE:
-- - Adds current_stage column: tracks which stage of 13-stage workflow the case is at
--   (DOCUMENTED, PARTIES_IDENTIFIED, SUMMONS_ISSUED, HEARING_CONDUCTED, etc.)
-- - Adds dispatch_required flag: explicit boolean set only when user makes PNP Referral decision
--   (replaces implicit dispatch trigger based on case_status = 'For Mediation')
-- - Both fields are optional (nullable/default FALSE)
-- - No existing data affected (all existing cases will have NULL/FALSE values)
--
-- DOES NOT TOUCH:
-- - case_documentations table rows/data (only adds columns)
-- - Any other tables
-- - Any existing operational workflows
-- - Existing case_status field (continues to mirror incidents.status)
--
-- BACKWARD COMPATIBILITY:
-- - Existing cases continue to work with new columns as NULL/FALSE
-- - dispatch_required defaults to FALSE (no unintended dispatch triggers)
-- - current_stage defaults to NULL (graceful degradation for old cases)
-- - Dispatch queue filter will be updated to check dispatch_required=TRUE separately
-- ============================================================================

-- ============================================================================
-- ALTER case_documentations TABLE - ADD WORKFLOW TRACKING
-- ============================================================================

ALTER TABLE public.case_documentations 
ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS dispatch_required BOOLEAN DEFAULT FALSE;

-- Add indexes for fast lookups (especially important for dispatch queue filtering)
CREATE INDEX IF NOT EXISTS idx_case_documentations_current_stage 
  ON public.case_documentations(current_stage) 
  WHERE current_stage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_case_documentations_dispatch_required 
  ON public.case_documentations(dispatch_required) 
  WHERE dispatch_required = TRUE;

-- Add documentation
COMMENT ON COLUMN public.case_documentations.current_stage 
  IS 'Current workflow stage (13-stage model): DOCUMENTED, PARTIES_IDENTIFIED, SUMMONS_ISSUED, HEARING_CONDUCTED, MEDIATION_ATTEMPTED, REFERRED_TO_PNP, DISPATCHED, OFFICER_ACTION, EVIDENCE_COLLECTED, CLOSED, etc. NULL for legacy cases.';

COMMENT ON COLUMN public.case_documentations.dispatch_required 
  IS 'Explicit flag set ONLY when case is referred to PNP in Resolution workflow. Controls visibility in Dispatch queue. FALSE (default) means case does not require dispatch.';

-- ============================================================================
-- VERIFY COLUMNS ADDED
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'case_documentations'
  AND column_name IN ('current_stage', 'dispatch_required')
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICATION: Show complete case_documentations table schema
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'case_documentations'
ORDER BY ordinal_position;

-- ============================================================================
-- BACKWARD COMPATIBILITY CHECK
-- ============================================================================
-- Count existing case_documentations records
-- All should have dispatch_required = FALSE and current_stage = NULL
-- confirming that no data migration is needed

SELECT 
  COUNT(*) as total_cases,
  COUNT(CASE WHEN dispatch_required = FALSE THEN 1 END) as cases_with_dispatch_required_false,
  COUNT(CASE WHEN current_stage IS NULL THEN 1 END) as cases_with_current_stage_null
FROM public.case_documentations;
