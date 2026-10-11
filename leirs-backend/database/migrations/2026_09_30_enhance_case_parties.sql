-- ============================================================================
-- LEIRS BARANGAY MEDIATION WORKFLOW - ENHANCE CASE PARTIES
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-30
-- Project: LEIRS REVISE
-- Purpose: Enhance case_parties table based on panel feedback
--
-- SCOPE:
-- - Add address column (optional, for both complainants and respondents)
-- - Add notes column (optional, for additional party information)
-- - Add information_status column (track completeness of party information)
--
-- DOES NOT TOUCH:
-- - Existing case_parties data (columns are nullable)
-- - Other tables or RLS policies
-- - Existing workflows
-- ============================================================================

-- ============================================================================
-- ADD NEW COLUMNS TO case_parties
-- ============================================================================

-- Add address column (optional - respondent info may not be available immediately)
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add notes column (for additional party information and documentation)
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add information_status column (track completeness)
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS information_status VARCHAR(30) 
DEFAULT 'Pending Verification' 
CHECK (information_status IN ('Complete', 'Pending Verification'));

-- ============================================================================
-- UPDATE COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.case_parties.address IS 'Physical address of the party (optional, may not be available immediately for respondents)';
COMMENT ON COLUMN public.case_parties.notes IS 'Additional notes or documentation about the party (e.g., "Address verification pending", "Details collected during hearing")';
COMMENT ON COLUMN public.case_parties.information_status IS 'Status of party information completeness: Complete or Pending Verification (default)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View updated table structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'case_parties'
  AND column_name IN ('address', 'notes', 'information_status')
ORDER BY ordinal_position;

-- Verify existing data is preserved
SELECT 
  COUNT(*) as total_parties,
  SUM(CASE WHEN address IS NULL THEN 1 ELSE 0 END) as parties_without_address,
  SUM(CASE WHEN notes IS NULL THEN 1 ELSE 0 END) as parties_without_notes,
  COUNT(CASE WHEN information_status = 'Pending Verification' THEN 1 END) as pending_verification,
  COUNT(CASE WHEN information_status = 'Complete' THEN 1 END) as complete
FROM public.case_parties;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- ALTER TABLE public.case_parties DROP COLUMN IF EXISTS address;
-- ALTER TABLE public.case_parties DROP COLUMN IF EXISTS notes;
-- ALTER TABLE public.case_parties DROP COLUMN IF EXISTS information_status;
-- ============================================================================

