-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 013 — Create evidence_custody table
--
-- Purpose: Track chain of custody history for evidence items.
-- Maintains permanent audit trail of evidence handling.
--
-- Relationship:
--   public.evidence (id)  1──────0..*  public.evidence_custody (evidence_id)
--
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards throughout).
-- Does NOT modify existing tables or data.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.evidence_custody (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id     UUID        NOT NULL
                              REFERENCES public.evidence (id)
                              ON DELETE CASCADE,
  action_type     TEXT        NOT NULL,
  from_user       TEXT,
  to_user         TEXT,
  location        TEXT,
  notes           TEXT,
  action_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT evidence_custody_action_check
    CHECK (action_type IN (
      'Received',
      'Transferred',
      'Released',
      'Returned',
      'In Court',
      'Archived'
    ))
);

-- 2. Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS evidence_custody_evidence_id_idx
  ON public.evidence_custody (evidence_id);

CREATE INDEX IF NOT EXISTS evidence_custody_action_at_idx
  ON public.evidence_custody (action_at DESC);

CREATE INDEX IF NOT EXISTS evidence_custody_action_type_idx
  ON public.evidence_custody (action_type);

-- 3. updated_at trigger ───────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_evidence_custody_updated_at ON public.evidence_custody;
CREATE TRIGGER set_evidence_custody_updated_at
  BEFORE UPDATE ON public.evidence_custody
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Enable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.evidence_custody ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'evidence_custody'
      AND policyname = 'evidence_custody_select_all'
  ) THEN
    CREATE POLICY evidence_custody_select_all
      ON public.evidence_custody
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'evidence_custody'
      AND policyname = 'evidence_custody_insert_auth'
  ) THEN
    CREATE POLICY evidence_custody_insert_auth
      ON public.evidence_custody
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'evidence_custody'
      AND policyname = 'evidence_custody_update_auth'
  ) THEN
    CREATE POLICY evidence_custody_update_auth
      ON public.evidence_custody
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 6. Add comments ─────────────────────────────────────────────────────────────

COMMENT ON TABLE public.evidence_custody IS 
  'Chain of custody audit trail for evidence items';

COMMENT ON COLUMN public.evidence_custody.action_type IS 
  'Type of custody action: Received, Transferred, Released, Returned, In Court, Archived';

COMMENT ON COLUMN public.evidence_custody.from_user IS 
  'User/entity transferring custody (null for initial receipt)';

COMMENT ON COLUMN public.evidence_custody.to_user IS 
  'User/entity receiving custody (null for release)';

COMMENT ON COLUMN public.evidence_custody.action_at IS 
  'Timestamp when the custody action occurred';

-- 7. Reload PostgREST schema cache ────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

