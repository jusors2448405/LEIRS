-- ============================================================================
-- LEIRS BARANGAY MEDIATION WORKFLOW - PHASE 1: EXTEND INCIDENTS TABLE
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-29
-- Project: LEIRS REVISE
-- Purpose: Add denormalized respondent columns to incidents table
--
-- SCOPE:
-- - Adds respondent_name and respondent_contact columns to incidents table
-- - Denormalization for fast queries without JOIN to case_parties
-- - These are optional fields; can be updated as mediation workflow progresses
-- - No existing data affected (all existing incidents NULL in these columns)
--
-- DOES NOT TOUCH:
-- - incidents table rows/data (only adds columns)
-- - case_parties table
-- - case_summons table
-- - barangay_hearings table
-- - mediation_records table
-- - profiles table
-- - Any existing operational workflows
-- ============================================================================

-- ============================================================================
-- ALTER incidents TABLE - ADD RESPONDENT COLUMNS
-- ============================================================================

-- Add respondent_name column (optional denormalization for speed)
ALTER TABLE public.incidents 
ADD COLUMN respondent_name TEXT,
ADD COLUMN respondent_contact TEXT;

-- Create comments for documentation
COMMENT ON COLUMN public.incidents.respondent_name IS 'Denormalized respondent name for fast query performance (also stored in case_parties table)';
COMMENT ON COLUMN public.incidents.respondent_contact IS 'Denormalized respondent contact for fast query performance (also stored in case_parties table)';

-- Create index for fast respondent lookups
CREATE INDEX idx_incidents_respondent_name ON public.incidents(respondent_name) WHERE respondent_name IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify new columns added to incidents table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
  AND column_name IN ('respondent_name', 'respondent_contact')
ORDER BY ordinal_position;

-- Verify incidents table structure with new columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'incidents'
ORDER BY ordinal_position;

-- ============================================================================
-- TESTING DATA QUERY (DO NOT RUN IN PRODUCTION WITHOUT REVIEW)
-- ============================================================================
-- Uncomment below to verify existing incidents are unaffected
-- SELECT 
--   id,
--   respondent_name,
--   respondent_contact,
--   status,
--   created_at
-- FROM public.incidents
-- LIMIT 5;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify new columns added successfully with verification query above
-- 3. ALL FOUR MIGRATION FILES COMPLETE
-- 4. Next phase: Create 5 React hooks for database operations
-- ============================================================================
-- ============================================================================
-- GRANT EXECUTE PERMISSION FOR RLS POLICY EXECUTION (Issue 1 & 2 Fix)
-- ============================================================================
-- Issue 1: RLS policies in case_parties, case_summons, barangay_hearings, and
--         mediation_records tables execute in the 'TO authenticated' context
--         but cannot call private.is_system_admin() without explicit GRANT.
--
-- Issue 2: RLS policies also call private.has_any_role() which has the same
--         permission issue - 'authenticated' role cannot EXECUTE it.
--
-- Solution: Grant EXECUTE permission to 'authenticated' role for both functions
--          so RLS policies can evaluate role checks when authenticated users access tables.
--
-- Affected by is_system_admin (16 RLS policies):
-- - case_parties (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - case_summons (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - barangay_hearings (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - mediation_records (4 policies: SELECT, INSERT, UPDATE, DELETE)
--
-- Affected by has_any_role (many RLS policies across all 4 tables):
-- - All case_admin role checks
-- - All dispatch_admin role checks
-- - All status_admin role checks
-- - All system_admin role checks (via system_admin policy fallback)
-- ============================================================================

GRANT EXECUTE ON FUNCTION private.is_system_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_any_role(UUID, TEXT[]) TO authenticated;