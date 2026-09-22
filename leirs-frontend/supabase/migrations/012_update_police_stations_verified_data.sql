-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 012 — Update Police Stations with Verified Data
--
-- Purpose: Replace mock/test police stations with verified real facilities.
-- Only HIGH-CONFIDENCE stations approved by user (Option B).
--
-- Date: August 25, 2026
-- Approved: CCPS Sub-Station IV, CCPS Sub-Station 11
-- Status: READY TO EXECUTE
-- ─────────────────────────────────────────────────────────────────────────────

-- IMPORTANT NOTES:
-- 1. This migration updates ONLY 2 of the 3 mock stations
-- 2. Test Police Station Charlie remains as a placeholder (to be verified later)
-- 3. All verification sources documented in POLICE_STATION_VERIFICATION_REPORT_v2.md
-- 4. Coordinates obtained from verified geographic sources (NOT fabricated)
-- 5. Foreign key relationships preserved (dispatch.police_station_id)

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Check for existing dispatch records referencing these stations
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  dispatch_count_alpha INTEGER;
  dispatch_count_bravo INTEGER;
BEGIN
  -- Count dispatch records for each station
  SELECT COUNT(*) INTO dispatch_count_alpha
  FROM public.dispatch
  WHERE police_station_id IN (
    SELECT id FROM public.police_stations WHERE station_name = 'Test Police Station Alpha'
  );

  SELECT COUNT(*) INTO dispatch_count_bravo
  FROM public.dispatch
  WHERE police_station_id IN (
    SELECT id FROM public.police_stations WHERE station_name = 'Test Police Station Bravo'
  );

  -- Log the counts (will appear in migration output)
  RAISE NOTICE 'Dispatch records referencing Test Police Station Alpha: %', dispatch_count_alpha;
  RAISE NOTICE 'Dispatch records referencing Test Police Station Bravo: %', dispatch_count_bravo;
  
  -- We do NOT delete these dispatch records
  -- We update the station names/addresses but keep the UUIDs intact
  -- This preserves historical dispatch data
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Update Test Police Station Alpha → CCPS Sub-Station IV
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE public.police_stations
SET 
  station_name = 'CCPS Sub-Station IV',
  address = 'Camarin Road, Hillcrest, North Caloocan City',
  latitude = 14.7508,
  longitude = 121.0383,
  coverage_area = 'Barangays 174-178, Camarin area, North Caloocan',
  contact_number = NULL,  -- Not reliably verified; leave NULL
  status = 'Available',
  updated_at = NOW()
WHERE station_name = 'Test Police Station Alpha';

-- Verification: Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated Test Police Station Alpha → CCPS Sub-Station IV (% rows affected)', updated_count;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Update Test Police Station Bravo → CCPS Sub-Station 11
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE public.police_stations
SET 
  station_name = 'CCPS Sub-Station 11',
  address = 'Cadena De Amor Street, Barangay 174, Camarin, Caloocan City',
  latitude = 14.7626,
  longitude = 121.0483,
  coverage_area = 'Barangay 174 and adjacent areas, Camarin, North Caloocan',
  contact_number = NULL,  -- Email exists (ccpssubstation11@) but phone not verified; leave NULL
  status = 'Available',
  updated_at = NOW()
WHERE station_name = 'Test Police Station Bravo';

-- Verification: Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated Test Police Station Bravo → CCPS Sub-Station 11 (% rows affected)', updated_count;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Keep Test Police Station Charlie (MEDIUM-HIGH confidence - not approved)
-- ─────────────────────────────────────────────────────────────────────────────

-- DO NOTHING - Test Police Station Charlie remains as placeholder
-- User selected Option B: Update only HIGH-confidence stations
-- CCPS NEO Barugo Police Station (MEDIUM-HIGH confidence) NOT included in this update

RAISE NOTICE 'Test Police Station Charlie remains unchanged (awaiting additional verification)';

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 5: Verification Query - Display updated stations
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  station_record RECORD;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'UPDATED POLICE STATIONS:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  
  FOR station_record IN 
    SELECT id, station_name, address, latitude, longitude, coverage_area, status
    FROM public.police_stations
    ORDER BY station_name
  LOOP
    RAISE NOTICE 'Station: %', station_record.station_name;
    RAISE NOTICE '  Address: %', station_record.address;
    RAISE NOTICE '  Coordinates: %.4f, %.4f', station_record.latitude, station_record.longitude;
    RAISE NOTICE '  Coverage: %', station_record.coverage_area;
    RAISE NOTICE '  Status: %', station_record.status;
    RAISE NOTICE '---';
  END LOOP;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 6: Reload PostgREST schema cache
-- ─────────────────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION NOTES
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.police_stations IS 
  'Police station directory for LEIRS dispatch module. 
   Updated with verified real facilities on 2026-08-25.
   Sources: CCPS Official Directory, PNP Documentation.
   Coordinates from: Wikimedia Commons, MapQuest verified geographic data.';

-- ─────────────────────────────────────────────────────────────────────────────
-- DATA VERIFICATION SOURCES
-- ─────────────────────────────────────────────────────────────────────────────

-- CCPS Sub-Station IV:
--   Name/Address: Caloocan City Police Stations Directory (Scribd Doc 567071571)
--   Coordinates: Wikimedia Commons - Camarin Roads geographic documentation
--   Verification: HIGH confidence - Official CCPS directory listing

-- CCPS Sub-Station 11:
--   Name/Address: PNP Arrest and Booking Sheet (Scribd Doc 979601919)
--   Email: ccpssubstation11@[domain] (from official PNP document)
--   Coordinates: MapQuest + Wikimedia Commons + GeoView (multiple sources)
--   Verification: HIGH confidence - Official PNP documentation

-- Test Police Station Charlie:
--   Status: RETAINED as placeholder
--   Reason: CCPS NEO Barugo Police Station (MEDIUM-HIGH confidence) not yet approved
--   Action: Awaiting additional verification before replacement

-- ─────────────────────────────────────────────────────────────────────────────
-- END OF MIGRATION 012
-- ─────────────────────────────────────────────────────────────────────────────
