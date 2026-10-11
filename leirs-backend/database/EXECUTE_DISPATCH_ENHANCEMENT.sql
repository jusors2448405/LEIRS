-- ============================================================
-- EXECUTE THIS IN SUPABASE SQL EDITOR
-- ============================================================
-- Migration: Dispatch Module Dual Response Enhancement
-- File: 2026_09_30_enhance_dispatch_dual_response.sql
-- 
-- IMPORTANT: This migration is SAFE for existing data
-- - All existing PNP dispatch records will be preserved
-- - New fields are NULLABLE
-- - Default values ensure backward compatibility
-- 
-- PREREQUISITES:
-- ✓ Case Parties migration executed
-- ✓ Routing Decision migration executed
-- ✓ Evidence Enhancement migration executed (optional)
-- 
-- ESTIMATED TIME: 30 seconds
-- ============================================================

-- Step 1: Add new columns
ALTER TABLE public.dispatch
    ADD COLUMN IF NOT EXISTS response_type VARCHAR(30) DEFAULT 'pnp_officer',
    ADD COLUMN IF NOT EXISTS responder_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS responder_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS response_purpose VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tanod_arrival_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS action_taken TEXT;

-- Step 2: Backfill existing records
UPDATE public.dispatch
SET response_type = 'pnp_officer'
WHERE response_type IS NULL;

-- Step 3: Update dispatch_status constraint
ALTER TABLE public.dispatch DROP CONSTRAINT IF EXISTS valid_dispatch_status;
ALTER TABLE public.dispatch ADD CONSTRAINT valid_dispatch_status CHECK (dispatch_status IN (
    'Pending', 'Assigned', 'Dispatched', 'On Scene', 'Action Taken', 'Completed',
    'Pending Station Response', 'Station Accepted', 'Station Declined', 'Officer Assigned', 'Responding'
));

-- Step 4: Add new constraints
ALTER TABLE public.dispatch ADD CONSTRAINT valid_response_type CHECK (
    response_type IS NULL OR response_type IN ('barangay_tanod', 'pnp_officer')
);

ALTER TABLE public.dispatch ADD CONSTRAINT valid_response_purpose CHECK (
    response_purpose IS NULL OR response_purpose IN (
        'Initial Verification', 'Public Assistance', 'Mediation Support', 
        'Law Enforcement Response', 'Emergency Response'
    )
);

-- Step 5: Add indexes
CREATE INDEX IF NOT EXISTS idx_dispatch_response_type ON public.dispatch(response_type);
CREATE INDEX IF NOT EXISTS idx_dispatch_response_purpose ON public.dispatch(response_purpose);

-- Step 6: Add comments
COMMENT ON COLUMN public.dispatch.response_type IS 'Type of response: barangay_tanod or pnp_officer (default)';
COMMENT ON COLUMN public.dispatch.responder_name IS 'Barangay Tanod responder name (use officer_name for PNP)';
COMMENT ON COLUMN public.dispatch.responder_role IS 'Barangay Tanod role: Tanod Captain, Tanod Member, etc.';
COMMENT ON COLUMN public.dispatch.response_purpose IS 'Purpose: Initial Verification, Public Assistance, Mediation Support, Law Enforcement Response, Emergency Response';
COMMENT ON COLUMN public.dispatch.tanod_arrival_time IS 'Timestamp when Barangay Tanod arrived on scene';
COMMENT ON COLUMN public.dispatch.action_taken IS 'Description of action taken by responder';

-- Verification
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE response_type = 'pnp_officer') as pnp_records,
    COUNT(*) FILTER (WHERE response_type = 'barangay_tanod') as tanod_records,
    COUNT(*) FILTER (WHERE response_type IS NULL) as null_records
FROM public.dispatch;

-- ✓ Migration Complete
-- All existing PNP dispatch records preserved with response_type = 'pnp_officer'
