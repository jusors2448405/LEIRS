-- ============================================================
-- LEIRS Dispatch Module Enhancement Migration
-- Adds Barangay Tanod response capability with unified workflow
-- Preserves all existing PNP dispatch functionality
-- ============================================================
-- 
-- CHANGES:
-- 1. Add response_type field (barangay_tanod | pnp_officer)
-- 2. Add responder_name, responder_role for Tanod workflow
-- 3. Add response_purpose field (5 options)
-- 4. Add action_taken and tanod_arrival_time
-- 5. Update dispatch_status constraint with unified 6-state flow
-- 6. Backfill existing records as pnp_officer type
--
-- BACKWARD COMPATIBILITY:
-- - All existing records get response_type = 'pnp_officer'
-- - All new fields are NULLABLE
-- - Existing PNP dispatch_status values still valid
-- - NULL response_type treated as pnp_officer in frontend
--
-- ============================================================

BEGIN;

-- ============================================================
-- Step 1: Add new columns
-- ============================================================

ALTER TABLE public.dispatch
    ADD COLUMN IF NOT EXISTS response_type VARCHAR(30) DEFAULT 'pnp_officer',
    ADD COLUMN IF NOT EXISTS responder_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS responder_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS response_purpose VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tanod_arrival_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS action_taken TEXT;

COMMENT ON COLUMN public.dispatch.response_type IS 'Type of response: barangay_tanod or pnp_officer (default for backward compatibility)';
COMMENT ON COLUMN public.dispatch.responder_name IS 'Barangay Tanod responder name (used when response_type = barangay_tanod). For PNP, use officer_name field.';
COMMENT ON COLUMN public.dispatch.responder_role IS 'Barangay Tanod role: Tanod Captain, Tanod Member, etc.';
COMMENT ON COLUMN public.dispatch.response_purpose IS 'Purpose: Initial Verification, Public Assistance, Mediation Support, Law Enforcement Response, Emergency Response';
COMMENT ON COLUMN public.dispatch.tanod_arrival_time IS 'Timestamp when Barangay Tanod arrived on scene (parallel to arrived_at for PNP)';
COMMENT ON COLUMN public.dispatch.action_taken IS 'Description of action taken by responder (populated when status = Action Taken or Completed)';

-- ============================================================
-- Step 2: Backfill existing records
-- ============================================================

-- Set all existing NULL response_type to pnp_officer
UPDATE public.dispatch
SET response_type = 'pnp_officer'
WHERE response_type IS NULL;

-- ============================================================
-- Step 3: Update dispatch_status constraint
-- Add unified status flow + preserve existing PNP statuses
-- ============================================================

ALTER TABLE public.dispatch DROP CONSTRAINT IF EXISTS valid_dispatch_status;

ALTER TABLE public.dispatch ADD CONSTRAINT valid_dispatch_status CHECK (dispatch_status IN (
    -- UNIFIED STATUS FLOW (Both Tanod and PNP)
    'Pending',                      -- Initial state
    'Assigned',                     -- Responder/Officer assigned
    'Dispatched',                   -- En route
    'On Scene',                     -- Arrived at location
    'Action Taken',                 -- Action recorded (pre-completion)
    'Completed',                    -- Final state
    
    -- LEGACY PNP STATUSES (Preserved for backward compatibility)
    'Pending Station Response',     -- PNP: Awaiting station acceptance
    'Station Accepted',             -- PNP: Station accepted request
    'Station Declined',             -- PNP: Station declined request
    'Officer Assigned',             -- PNP: Officer assigned (maps to 'Assigned')
    'Responding'                    -- PNP: Officer responding (maps to 'Dispatched')
));

-- ============================================================
-- Step 4: Add new constraints
-- ============================================================

-- Response type constraint
ALTER TABLE public.dispatch ADD CONSTRAINT valid_response_type CHECK (
    response_type IS NULL OR response_type IN ('barangay_tanod', 'pnp_officer')
);

-- Response purpose constraint
ALTER TABLE public.dispatch ADD CONSTRAINT valid_response_purpose CHECK (
    response_purpose IS NULL OR response_purpose IN (
        'Initial Verification',
        'Public Assistance',
        'Mediation Support',
        'Law Enforcement Response',
        'Emergency Response'
    )
);

-- ============================================================
-- Step 5: Add indexes for filtering
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dispatch_response_type ON public.dispatch(response_type);
CREATE INDEX IF NOT EXISTS idx_dispatch_response_purpose ON public.dispatch(response_purpose);
CREATE INDEX IF NOT EXISTS idx_dispatch_unified_status ON public.dispatch(dispatch_status) 
    WHERE dispatch_status IN ('Pending', 'Assigned', 'Dispatched', 'On Scene', 'Action Taken', 'Completed');

-- ============================================================
-- Step 6: Create view for unified status mapping (optional)
-- ============================================================

CREATE OR REPLACE VIEW dispatch_unified_view AS
SELECT 
    d.*,
    -- Map legacy PNP statuses to unified statuses for reporting
    CASE 
        WHEN d.dispatch_status = 'Pending Station Response' THEN 'Pending'
        WHEN d.dispatch_status = 'Station Accepted' THEN 'Pending'
        WHEN d.dispatch_status = 'Station Declined' THEN 'Pending'
        WHEN d.dispatch_status = 'Officer Assigned' THEN 'Assigned'
        WHEN d.dispatch_status = 'Responding' THEN 'Dispatched'
        ELSE d.dispatch_status
    END AS unified_status,
    -- Determine responder name (Tanod vs PNP)
    CASE 
        WHEN d.response_type = 'barangay_tanod' THEN d.responder_name
        ELSE d.officer_name
    END AS primary_responder,
    -- Determine arrival time (Tanod vs PNP)
    CASE 
        WHEN d.response_type = 'barangay_tanod' THEN d.tanod_arrival_time
        ELSE d.arrived_at
    END AS primary_arrival_time,
    -- Response type display label
    CASE 
        WHEN d.response_type = 'barangay_tanod' THEN 'Barangay Tanod'
        ELSE 'PNP Officer'
    END AS response_type_label
FROM public.dispatch d;

COMMENT ON VIEW dispatch_unified_view IS 'Unified view of dispatch records with mapped statuses and responder info for both Tanod and PNP workflows';

-- ============================================================
-- Step 7: Verification Queries
-- ============================================================

-- Verify existing PNP records have response_type set
DO $$
DECLARE
    existing_count INTEGER;
    backfilled_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count FROM public.dispatch;
    SELECT COUNT(*) INTO backfilled_count FROM public.dispatch WHERE response_type = 'pnp_officer';
    
    RAISE NOTICE 'Total dispatch records: %', existing_count;
    RAISE NOTICE 'Records set as pnp_officer: %', backfilled_count;
    
    IF existing_count > 0 AND backfilled_count = existing_count THEN
        RAISE NOTICE '✓ All existing records successfully backfilled as pnp_officer';
    ELSIF existing_count > 0 AND backfilled_count < existing_count THEN
        RAISE WARNING '⚠ Some records may not have response_type set. Check manually.';
    ELSE
        RAISE NOTICE 'ℹ No existing dispatch records found (fresh database)';
    END IF;
END $$;

COMMIT;

-- ============================================================
-- Migration Complete
-- ============================================================

-- Verify constraints
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.dispatch'::regclass
    AND conname IN ('valid_dispatch_status', 'valid_response_type', 'valid_response_purpose')
ORDER BY conname;

-- Verify indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'dispatch'
    AND indexname LIKE 'idx_dispatch_%'
ORDER BY indexname;

-- ============================================================
-- NOTES FOR FRONTEND IMPLEMENTATION:
-- ============================================================
--
-- 1. BACKWARD COMPATIBILITY:
--    - Treat NULL or 'pnp_officer' as PNP workflow
--    - const isPNP = !dispatch.response_type || dispatch.response_type === 'pnp_officer'
--
-- 2. STATUS MAPPING:
--    - PNP: Use existing status field (Pending Station Response, etc.)
--    - Tanod: Use unified statuses (Pending, Assigned, Dispatched, etc.)
--    - For display, map legacy PNP statuses to unified for consistency
--
-- 3. RESPONDER NAME:
--    - PNP: Use officer_name field
--    - Tanod: Use responder_name field
--
-- 4. ARRIVAL TIME:
--    - PNP: Use arrived_at field
--    - Tanod: Use tanod_arrival_time field
--
-- ============================================================
