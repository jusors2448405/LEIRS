-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 010 — Add location coordinates to incidents
--
-- Purpose: Add optional latitude/longitude fields for map-based dispatch.
-- Existing incidents will have NULL coordinates until updated.
--
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards throughout).
-- Does NOT modify existing data.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add coordinate columns (nullable) ────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'incidents'
      AND column_name = 'location_latitude'
  ) THEN
    ALTER TABLE public.incidents
    ADD COLUMN location_latitude DECIMAL(10, 8);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'incidents'
      AND column_name = 'location_longitude'
  ) THEN
    ALTER TABLE public.incidents
    ADD COLUMN location_longitude DECIMAL(11, 8);
  END IF;
END $$;

-- 2. Add index for coordinate lookups ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS incidents_location_coords_idx
  ON public.incidents (location_latitude, location_longitude)
  WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- 3. Add comment explaining test coordinates ──────────────────────────────────

COMMENT ON COLUMN public.incidents.location_latitude IS 
  'Optional latitude for map display. Test coordinates are clearly marked in the data.';

COMMENT ON COLUMN public.incidents.location_longitude IS 
  'Optional longitude for map display. Test coordinates are clearly marked in the data.';

-- 4. Insert test coordinates for existing test incidents (optional) ───────────
-- This updates any existing test incidents with mock coordinates
-- Real incidents should have real coordinates or remain NULL

-- Example: Update test incidents (if any exist) with test coordinates
-- UPDATE public.incidents 
-- SET location_latitude = 14.7630, location_longitude = 121.0430
-- WHERE description LIKE '%test%' OR description LIKE '%mock%';

-- 5. Reload PostgREST schema cache ────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
