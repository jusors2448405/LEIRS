-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 011 — Modify dispatch table for police station workflow
--
-- Purpose: Add police station selection and response tracking to dispatch.
-- Supports the workflow: Select Station → Station Response → Officer Assignment
--
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards throughout).
-- Does NOT modify existing dispatch records.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add police_station_id foreign key ────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dispatch'
      AND column_name = 'police_station_id'
  ) THEN
    ALTER TABLE public.dispatch
    ADD COLUMN police_station_id UUID REFERENCES public.police_stations(id);
  END IF;
END $$;

-- 2. Add station response tracking fields ─────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dispatch'
      AND column_name = 'station_response_status'
  ) THEN
    ALTER TABLE public.dispatch
    ADD COLUMN station_response_status TEXT DEFAULT 'Pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dispatch'
      AND column_name = 'station_responded_at'
  ) THEN
    ALTER TABLE public.dispatch
    ADD COLUMN station_responded_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dispatch'
      AND column_name = 'officer_assigned_at'
  ) THEN
    ALTER TABLE public.dispatch
    ADD COLUMN officer_assigned_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dispatch'
      AND column_name = 'arrived_at'
  ) THEN
    ALTER TABLE public.dispatch
    ADD COLUMN arrived_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dispatch'
      AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.dispatch
    ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Drop old dispatch_status constraint ──────────────────────────────────────

ALTER TABLE public.dispatch DROP CONSTRAINT IF EXISTS dispatch_status_check;

-- 4. Add new dispatch_status constraint with station workflow ─────────────────

ALTER TABLE public.dispatch
ADD CONSTRAINT dispatch_status_check
CHECK (dispatch_status IN (
  'Pending Station Response',
  'Station Accepted',
  'Station Declined',
  'Officer Assigned',
  'Dispatched',
  'Responding',
  'On Scene',
  'Completed'
));

-- 5. Add station_response_status constraint ───────────────────────────────────

ALTER TABLE public.dispatch DROP CONSTRAINT IF EXISTS station_response_status_check;

ALTER TABLE public.dispatch
ADD CONSTRAINT station_response_status_check
CHECK (station_response_status IN (
  'Pending',
  'Accepted',
  'Declined'
));

-- 6. Add indexes for new fields ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS dispatch_police_station_id_idx
  ON public.dispatch (police_station_id);

CREATE INDEX IF NOT EXISTS dispatch_station_response_idx
  ON public.dispatch (station_response_status);

-- 7. Add comments explaining the workflow ─────────────────────────────────────

COMMENT ON COLUMN public.dispatch.police_station_id IS 
  'Selected police station for this dispatch request';

COMMENT ON COLUMN public.dispatch.station_response_status IS 
  'Station response: Pending/Accepted/Declined';

COMMENT ON COLUMN public.dispatch.dispatch_status IS 
  'Overall dispatch status through workflow stages';

COMMENT ON COLUMN public.dispatch.officer_name IS 
  'Officer name - assigned AFTER station accepts the request';

-- 8. Reload PostgREST schema cache ────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
