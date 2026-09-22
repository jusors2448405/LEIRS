-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 012 — Add status field to evidence table
--
-- Purpose: Track evidence lifecycle status for chain of custody management.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards throughout).
-- Does NOT modify existing evidence data (new column is nullable with default).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add status column ────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'evidence'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.evidence
    ADD COLUMN status TEXT NOT NULL DEFAULT 'Logged';
  END IF;
END $$;

-- 2. Add status constraint ────────────────────────────────────────────────────

ALTER TABLE public.evidence DROP CONSTRAINT IF EXISTS evidence_status_check;

ALTER TABLE public.evidence
ADD CONSTRAINT evidence_status_check
CHECK (status IN (
  'Logged',
  'In Custody',
  'Released',
  'In Court',
  'Returned',
  'Archived'
));

-- 3. Add current_custodian field (optional) ───────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'evidence'
      AND column_name = 'current_custodian'
  ) THEN
    ALTER TABLE public.evidence
    ADD COLUMN current_custodian TEXT;
  END IF;
END $$;

-- 4. Add status index ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS evidence_status_idx
  ON public.evidence (status);

-- 5. Add comments ─────────────────────────────────────────────────────────────

COMMENT ON COLUMN public.evidence.status IS 
  'Evidence lifecycle status: Logged → In Custody → Released/In Court → Returned → Archived';

COMMENT ON COLUMN public.evidence.current_custodian IS 
  'Current person/entity holding the evidence (name or username)';

-- 6. Reload PostgREST schema cache ────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

