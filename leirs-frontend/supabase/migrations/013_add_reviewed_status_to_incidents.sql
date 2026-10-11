-- ============================================================================
-- Migration: Add REVIEWED status to incidents table
-- ============================================================================
-- Date: 2026-09-25
-- Project: LEIRS REVISE
-- Purpose: Add REVIEWED status to incidents_status_check constraint
--
-- SCOPE:
-- - Updates incidents_status_check constraint to include 'REVIEWED' status
-- - Preserves all existing allowed status values
-- - No data modifications (constraint only applies to new writes)
-- - No table structure changes
--
-- SEMANTICS:
-- - REVIEWED: Incident Admin has verified and is ready for Case Documentation
-- - Under Investigation: Case has progressed into investigation stage
-- - These are NOT interchangeable
--
-- DOES NOT TOUCH:
-- - RLS policies
-- - Table columns
-- - Existing incident records
-- - Related tables (case_documentations, dispatch, evidence, etc.)
-- ============================================================================

-- Drop the old constraint
ALTER TABLE public.incidents
DROP CONSTRAINT incidents_status_check;

-- Add the new constraint with REVIEWED status included
ALTER TABLE public.incidents
ADD CONSTRAINT incidents_status_check CHECK (
  status IN (
    'Pending',
    'REVIEWED',
    'Under Investigation',
    'For Mediation',
    'Resolved',
    'Closed'
  )
);

-- Comment on the constraint
COMMENT ON CONSTRAINT incidents_status_check ON public.incidents
IS 'Enforces valid incident status values. REVIEWED = verified by Incident Admin, ready for Case Documentation. Under Investigation = case in investigation stage.';

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify constraint was applied correctly)
-- ============================================================================

-- Query 1: Verify constraint exists and has correct values
SELECT 
  'Constraint verification' as check_name,
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'incidents' 
  AND constraint_name = 'incidents_status_check'
ORDER BY constraint_name;

-- Query 2: Test that all six status values are now allowed (will succeed with no errors)
-- These SELECT statements verify the constraint allows these values without inserting data
SELECT 
  'incidents_status_check allows' as verification,
  'Pending' as status
UNION ALL
SELECT 'incidents_status_check allows', 'REVIEWED'
UNION ALL
SELECT 'incidents_status_check allows', 'Under Investigation'
UNION ALL
SELECT 'incidents_status_check allows', 'For Mediation'
UNION ALL
SELECT 'incidents_status_check allows', 'Resolved'
UNION ALL
SELECT 'incidents_status_check allows', 'Closed';

