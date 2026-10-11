-- ============================================================================
-- ⚠️  EXECUTE THIS MIGRATION IN SUPABASE SQL EDITOR
-- ============================================================================
-- Purpose: Add address, notes, and information_status columns to case_parties
-- Date: 2026-09-30
-- Impact: NO DATA LOSS - Existing records preserved
-- ============================================================================

-- Step 1: Add address column (optional field)
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Step 2: Add notes column (optional field)
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 3: Add information_status column with default value
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS information_status VARCHAR(30) DEFAULT 'Pending Verification';

-- Step 4: Add check constraint for information_status (only if column was just created)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'case_parties_information_status_check'
  ) THEN
    ALTER TABLE public.case_parties
    ADD CONSTRAINT case_parties_information_status_check 
    CHECK (information_status IN ('Complete', 'Pending Verification'));
  END IF;
END $$;

-- Step 5: Add helpful column comments
COMMENT ON COLUMN public.case_parties.address IS 'Physical address of the party (optional, may not be available immediately for respondents)';
COMMENT ON COLUMN public.case_parties.notes IS 'Additional notes or documentation about the party (e.g., "Address verification pending", "Details collected during hearing")';
COMMENT ON COLUMN public.case_parties.information_status IS 'Status of party information completeness: Complete or Pending Verification (default)';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to confirm success)
-- ============================================================================

-- Query 1: Check new columns exist
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'case_parties'
  AND column_name IN ('address', 'notes', 'information_status')
ORDER BY column_name;

-- Expected: 3 rows showing address, information_status, and notes

-- Query 2: Verify existing records are preserved
SELECT 
  COUNT(*) as total_records,
  COUNT(address) as records_with_address,
  COUNT(notes) as records_with_notes,
  SUM(CASE WHEN information_status = 'Pending Verification' THEN 1 ELSE 0 END) as pending_verification,
  SUM(CASE WHEN information_status = 'Complete' THEN 1 ELSE 0 END) as complete
FROM public.case_parties;

-- Expected: All existing records should have information_status = 'Pending Verification' (default)

-- Query 3: View all columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'case_parties'
ORDER BY ordinal_position;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/kyvhyhmqwcxbloiliojw
-- 2. Click "SQL Editor" in left sidebar
-- 3. Click "New Query"
-- 4. Copy lines 10-36 above (the ALTER TABLE and COMMENT statements)
-- 5. Paste into SQL Editor
-- 6. Click "Run" button
-- 7. Check output - should see "Success. No rows returned"
-- 8. Run verification queries to confirm
-- 9. Restart your dev server (Ctrl+C then npm run dev)
-- ============================================================================

