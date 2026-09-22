-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 009 — Create public.police_stations
--
-- Purpose: Store police station information for the dispatch module.
-- Stations are selected by dispatch admin to handle incidents.
--
-- Safe to run multiple times (IF NOT EXISTS guards throughout).
-- Does NOT modify any existing table or data.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.police_stations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  station_name     TEXT        NOT NULL,
  address          TEXT        NOT NULL,
  latitude         DECIMAL(10, 8),  -- Optional: for map display
  longitude        DECIMAL(11, 8),  -- Optional: for map display
  contact_number   TEXT,            -- Optional: real contact info only
  status           TEXT        NOT NULL DEFAULT 'Available',
  coverage_area    TEXT,            -- Optional: description of coverage
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT police_stations_status_check
    CHECK (status IN ('Available', 'Unavailable', 'Busy'))
);

-- 2. Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS police_stations_status_idx
  ON public.police_stations (status);

CREATE INDEX IF NOT EXISTS police_stations_location_idx
  ON public.police_stations (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. updated_at trigger — reuses the existing set_updated_at() function ───────
DROP TRIGGER IF EXISTS set_police_stations_updated_at ON public.police_stations;
CREATE TRIGGER set_police_stations_updated_at
  BEFORE UPDATE ON public.police_stations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.police_stations ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies (public read, authenticated write) ──────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'police_stations'
      AND policyname = 'police_stations_select_all'
  ) THEN
    CREATE POLICY police_stations_select_all
      ON public.police_stations
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
      AND tablename  = 'police_stations'
      AND policyname = 'police_stations_insert_auth'
  ) THEN
    CREATE POLICY police_stations_insert_auth
      ON public.police_stations
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
      AND tablename  = 'police_stations'
      AND policyname = 'police_stations_update_auth'
  ) THEN
    CREATE POLICY police_stations_update_auth
      ON public.police_stations
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 6. Insert test/mock police station data ─────────────────────────────────────
-- IMPORTANT: These are TEST stations for development only.
-- Real station data must be verified before production use.

INSERT INTO public.police_stations (station_name, address, latitude, longitude, coverage_area, status)
VALUES 
  (
    'Test Police Station Alpha',
    'Mock Address - North Caloocan (Test Data)',
    14.7644,  -- Test coordinate: Near Camarin, Caloocan
    121.0419,
    'Test coverage: Barangay 178, Camarin area',
    'Available'
  ),
  (
    'Test Police Station Bravo',
    'Mock Address - Camarin Central (Test Data)',
    14.7580,  -- Test coordinate: Camarin vicinity
    121.0450,
    'Test coverage: Camarin central area',
    'Available'
  ),
  (
    'Test Police Station Charlie',
    'Mock Address - East Camarin (Test Data)',
    14.7620,  -- Test coordinate: East of Camarin
    121.0500,
    'Test coverage: Eastern Camarin area',
    'Available'
  )
ON CONFLICT DO NOTHING;

-- 7. Reload PostgREST schema cache ────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
