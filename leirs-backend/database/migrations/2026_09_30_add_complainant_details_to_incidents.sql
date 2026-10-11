-- ============================================================================
-- LEIRS WORKFLOW ENHANCEMENT - ADD COMPLAINANT DETAILS TO INCIDENTS TABLE
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-30
-- Project: LEIRS REVISE
-- Purpose: Add complainant email and address fields to incidents table
--
-- SCOPE:
-- - Adds complainant_email and complainant_address columns
-- - Enables full complainant information collection at incident reporting stage
-- - These fields are optional (nullable)
-- - No existing data affected (all existing incidents will have NULL values)
--
-- DOES NOT TOUCH:
-- - incidents table rows/data (only adds columns)
-- - Any other tables
-- - Any existing operational workflows
--
-- BACKWARD COMPATIBILITY:
-- - Existing incidents table unaffected
-- - Existing records continue to work with NULL values in new columns
-- ============================================================================

-- ============================================================================
-- ALTER incidents TABLE - ADD COMPLAINANT DETAILS
-- ============================================================================

ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS complainant_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS complainant_address TEXT;

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_incidents_complainant_email 
  ON public.incidents(complainant_email) 
  WHERE complainant_email IS NOT NULL;

-- Add documentation
COMMENT ON COLUMN public.incidents.complainant_email 
  IS 'Complainant email address for notifications and case communications';
  
COMMENT ON COLUMN public.incidents.complainant_address 
  IS 'Complainant address for case documentation and official communications';

-- ============================================================================
-- VERIFY COLUMNS ADDED
-- ============================================================================

-- Display newly added columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
  AND column_name IN ('complainant_email', 'complainant_address')
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFICATION: Show complete incidents table schema
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
ORDER BY ordinal_position;
