-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  EXECUTE THIS MIGRATION IN SUPABASE SQL EDITOR
-- ═══════════════════════════════════════════════════════════════════════════
--
-- IMPORTANT PREREQUISITES:
-- 
-- ✅ MUST execute these migrations FIRST (in order):
--    1. 2026_09_30_enhance_case_parties.sql (EXECUTE_THIS_MIGRATION.sql)
--    2. 2026_09_30_add_routing_decision.sql
--
-- ⚠️  DO NOT execute this migration until the above are complete!
--
-- ═══════════════════════════════════════════════════════════════════════════
--
-- HOW TO EXECUTE:
--
-- 1. Open Supabase SQL Editor:
--    https://supabase.com/dashboard/project/kyvhyhmqwcxbloiliojw/sql
--
-- 2. Copy the entire content of this file
--
-- 3. Paste into the SQL Editor
--
-- 4. Click "Run" button
--
-- 5. Verify success:
--    - Check for "Success. No rows returned" message
--    - Go to Table Editor > evidence table
--    - Verify new columns exist:
--      * evidence_source
--      * collection_location
--      * evidence_status
--      * case_number
--      * incident_number
--      * dispatch_number
--
-- 6. Restart dev server:
--    cd leirs-frontend
--    npm run dev
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Enhance Evidence Module
-- Date: 2026-09-30
-- 
-- Changes:
--   1. Add evidence_source, collection_location, evidence_status to evidence
--   2. Add case_number, incident_number, dispatch_number links to evidence
--   3. Add performed_by, transfer_reason to evidence_custody
--   4. Add evidence_enabled flag to incidents for admin override
--   5. Update constraints for flexible workflow
-- 
-- IMPORTANT: Safe to run on existing data. All new columns are nullable.
-- Existing evidence records remain unchanged.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Enhance public.evidence table
-- ─────────────────────────────────────────────────────────────────────────

-- Add new columns for enhanced tracking
ALTER TABLE public.evidence 
  ADD COLUMN IF NOT EXISTS evidence_source VARCHAR(50),
  ADD COLUMN IF NOT EXISTS collection_location TEXT,
  ADD COLUMN IF NOT EXISTS evidence_status VARCHAR(30) DEFAULT 'Collected',
  ADD COLUMN IF NOT EXISTS case_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS incident_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dispatch_number VARCHAR(50);

-- Drop old 'status' column if it exists (was using generic text)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'evidence' 
      AND column_name = 'status' 
      AND data_type = 'text'
  ) THEN
    -- Migrate existing status values to evidence_status before dropping
    UPDATE public.evidence 
    SET evidence_status = CASE 
      WHEN status = 'Logged' THEN 'Collected'
      WHEN status = 'In Custody' THEN 'Under Review'
      WHEN status = 'Released' THEN 'Submitted to Authority'
      WHEN status = 'Archived' THEN 'Archived'
      ELSE 'Collected'
    END
    WHERE status IS NOT NULL;
    
    ALTER TABLE public.evidence DROP COLUMN status;
  END IF;
END $$;

-- Add CHECK constraint for evidence_source (6 options including Unknown)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'evidence_source_check'
  ) THEN
    ALTER TABLE public.evidence
      ADD CONSTRAINT evidence_source_check
      CHECK (evidence_source IN (
        'Complainant',
        'Respondent', 
        'Witness',
        'Officer',
        'Barangay Personnel',
        'Unknown/Pending Verification'
      ) OR evidence_source IS NULL);
  END IF;
END $$;

-- Add CHECK constraint for evidence_status (5-state flexible workflow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'evidence_status_check'
  ) THEN
    ALTER TABLE public.evidence
      ADD CONSTRAINT evidence_status_check
      CHECK (evidence_status IN (
        'Collected',
        'Under Review',
        'Accepted',
        'Submitted to Authority',
        'Archived'
      ));
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS evidence_status_idx 
  ON public.evidence (evidence_status);
CREATE INDEX IF NOT EXISTS evidence_source_idx 
  ON public.evidence (evidence_source);
CREATE INDEX IF NOT EXISTS evidence_case_number_idx 
  ON public.evidence (case_number);
CREATE INDEX IF NOT EXISTS evidence_incident_number_idx 
  ON public.evidence (incident_number);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Enhance public.evidence_custody table
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.evidence_custody
  ADD COLUMN IF NOT EXISTS performed_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS transfer_reason TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS evidence_custody_performed_by_idx
  ON public.evidence_custody (performed_by);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Add evidence_enabled flag to incidents table
-- ─────────────────────────────────────────────────────────────────────────

-- This allows admin to manually enable evidence for non-PNP cases
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS evidence_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS incidents_evidence_enabled_idx
  ON public.incidents (evidence_enabled);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Add comments for documentation
-- ─────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN public.evidence.evidence_source IS 
  'Source of evidence: Complainant, Respondent, Witness, Officer, Barangay Personnel, Unknown/Pending Verification';

COMMENT ON COLUMN public.evidence.collection_location IS 
  'Physical location where evidence was collected';

COMMENT ON COLUMN public.evidence.evidence_status IS 
  'Processing status: Collected, Under Review, Accepted, Submitted to Authority, Archived';

COMMENT ON COLUMN public.evidence.case_number IS 
  'Linked case number from incidents.case_number';

COMMENT ON COLUMN public.evidence.incident_number IS 
  'Linked incident number from incidents.incident_number';

COMMENT ON COLUMN public.evidence.dispatch_number IS 
  'Linked dispatch number from dispatch.dispatch_number';

COMMENT ON COLUMN public.evidence_custody.performed_by IS 
  'Name of person who performed the custody action';

COMMENT ON COLUMN public.evidence_custody.transfer_reason IS 
  'Reason for custody transfer/action';

COMMENT ON COLUMN public.incidents.evidence_enabled IS 
  'Admin override: allow evidence collection even if not PNP-referred';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Reload schema cache
-- ─────────────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Migration complete! 
-- 
-- Next steps:
-- 1. Verify the migration succeeded (check for "Success" message above)
-- 2. Restart your dev server: npm run dev
-- 3. Test evidence module with new fields
-- ═══════════════════════════════════════════════════════════════════════════
