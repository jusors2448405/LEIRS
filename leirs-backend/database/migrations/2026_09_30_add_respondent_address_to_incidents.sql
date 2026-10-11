-- ============================================================================
-- LEIRS WORKFLOW ENHANCEMENT - ADD RESPONDENT ADDRESS TO INCIDENTS TABLE
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-30
-- Project: LEIRS REVISE
-- Purpose: Add respondent address field to incidents table
--
-- SCOPE:
-- - Adds respondent_address column (denormalized from case_parties)
-- - Enables fast queries for respondent address without JOIN
-- - Completes respondent information collection at incident reporting stage
-- - Field is optional (nullable)
-- - No existing data affected
--
-- NOTE:
-- - respondent_name and respondent_contact already exist (from 2026_09_29 migration)
-- - This migration adds the missing respondent_address field
--
-- DOES NOT TOUCH:
-- - incidents table rows/data (only adds column)
-- - Any other tables
-- - Any existing operational workflows
--
-- BACKWARD COMPATIBILITY:
-- - Existing incidents table unaffected
-- - Existing records continue to work with NULL values in new column
-- ============================================================================

-- ============================================================================
-- ALTER incidents TABLE - ADD RESPONDENT ADDRESS
-- ============================================================================

ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS respondent_address TEXT;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_incidents_respondent_address 
  ON public.incidents(respondent_address) 
  WHERE respondent_address IS NOT NULL;

-- Add documentation
COMMENT ON COLUMN public.incidents.respondent_address 
  IS 'Denormalized respondent address for fast query performance (also stored in case_parties table); used for summons service and case documentation';

-- ============================================================================
-- VERIFY COLUMN ADDED
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
  AND column_name = 'respondent_address'
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICATION: Show all respondent-related columns in incidents table
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
  AND column_name LIKE 'respondent_%'
ORDER BY ordinal_position;
