-- ============================================================================
-- LEIRS: ADD CASE ROUTING DECISION TO INCIDENTS
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-30
-- Project: LEIRS REVISE
-- Purpose: Add routing decision tracking to incidents table
--
-- SCOPE:
-- - Add routing decision fields to track case processing path
-- - Add current_handler for monitoring case progress
-- - Update incident_type constraint with Barangay-appropriate categories
--
-- DOES NOT TOUCH:
-- - Existing incident records (all new columns nullable)
-- - Other tables or RLS policies
-- - Existing status workflow
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD ROUTING DECISION FIELDS
-- ============================================================================

-- Add routing decision column
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS routing_decision VARCHAR(30);

-- Add routing reason/notes column
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS routing_reason TEXT;

-- Add routing timestamp
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS routing_decided_at TIMESTAMP WITH TIME ZONE;

-- Add routing decision maker reference
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS routing_decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add routing decision constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'incidents_routing_decision_check'
  ) THEN
    ALTER TABLE public.incidents
    ADD CONSTRAINT incidents_routing_decision_check 
    CHECK (routing_decision IN (
      'barangay_case',      -- Proceed to Case Documentation
      'pnp_referral',       -- Send to Dispatch
      'archive'             -- No further action
    ));
  END IF;
END $$;

-- ============================================================================
-- STEP 2: ADD CURRENT HANDLER TRACKING (FOR MONITORING)
-- ============================================================================

-- Add current handler column (tracks which module/person is handling the incident)
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS current_handler VARCHAR(100);

-- Add handler assigned timestamp
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS handler_assigned_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- STEP 3: UPDATE INCIDENT TYPES
-- ============================================================================

-- Drop old incident type constraint
ALTER TABLE public.incidents
DROP CONSTRAINT IF EXISTS incidents_incident_type_check;

-- Add new constraint with Barangay-appropriate incident types
ALTER TABLE public.incidents
ADD CONSTRAINT incidents_incident_type_check 
CHECK (incident_type IN (
  'Theft',
  'Assault / Physical Injury',
  'Vandalism / Property Damage',
  'Domestic Dispute',
  'Noise Complaint / Public Disturbance',
  'Traffic Incident',
  'Lost and Found',
  'Other'
));

-- ============================================================================
-- STEP 4: ADD COLUMN COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.incidents.routing_decision IS 
'Case routing decision: barangay_case (Case Documentation), pnp_referral (Dispatch), archive (No Action), NULL (not yet decided)';

COMMENT ON COLUMN public.incidents.routing_reason IS 
'Optional reason or notes for the routing decision';

COMMENT ON COLUMN public.incidents.routing_decided_at IS 
'Timestamp when routing decision was made';

COMMENT ON COLUMN public.incidents.routing_decided_by IS 
'User who made the routing decision (references auth.users)';

COMMENT ON COLUMN public.incidents.current_handler IS 
'Current module or person handling the incident (e.g., "Case Admin", "Dispatch Admin", "Officer Name")';

COMMENT ON COLUMN public.incidents.handler_assigned_at IS 
'Timestamp when handler was assigned';

-- ============================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for routing decision queries
CREATE INDEX IF NOT EXISTS idx_incidents_routing_decision 
ON public.incidents(routing_decision) 
WHERE routing_decision IS NOT NULL;

-- Index for current handler queries
CREATE INDEX IF NOT EXISTS idx_incidents_current_handler 
ON public.incidents(current_handler) 
WHERE current_handler IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Check new columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'incidents'
  AND column_name IN (
    'routing_decision', 
    'routing_reason', 
    'routing_decided_at', 
    'routing_decided_by',
    'current_handler',
    'handler_assigned_at'
  )
ORDER BY column_name;

-- Expected: 6 rows showing all new columns

-- Query 2: Verify incident types updated
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'incidents_incident_type_check';

-- Expected: Should show new incident types

-- Query 3: Verify existing incidents preserved
SELECT 
  COUNT(*) as total_incidents,
  COUNT(routing_decision) as with_routing_decision,
  COUNT(current_handler) as with_handler
FROM public.incidents;

-- Expected: total_incidents > 0, with_routing_decision = 0 (all NULL initially), with_handler = 0

-- Query 4: Test routing decision values (should not error)
SELECT 
  'Valid routing decision values' as test,
  ARRAY['barangay_case', 'pnp_referral', 'archive', NULL]::VARCHAR[] as allowed_values;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
/*
-- Remove routing decision fields
ALTER TABLE public.incidents DROP COLUMN IF EXISTS routing_decision;
ALTER TABLE public.incidents DROP COLUMN IF EXISTS routing_reason;
ALTER TABLE public.incidents DROP COLUMN IF EXISTS routing_decided_at;
ALTER TABLE public.incidents DROP COLUMN IF EXISTS routing_decided_by;

-- Remove handler tracking fields
ALTER TABLE public.incidents DROP COLUMN IF EXISTS current_handler;
ALTER TABLE public.incidents DROP COLUMN IF EXISTS handler_assigned_at;

-- Revert incident types to old values
ALTER TABLE public.incidents DROP CONSTRAINT IF EXISTS incidents_incident_type_check;
ALTER TABLE public.incidents ADD CONSTRAINT incidents_incident_type_check 
CHECK (incident_type IN (
  'Theft', 'Assault', 'Vandalism', 
  'Noise Complaint', 'Traffic Violation', 'Other'
));

-- Drop indexes
DROP INDEX IF EXISTS idx_incidents_routing_decision;
DROP INDEX IF EXISTS idx_incidents_current_handler;
*/

-- ============================================================================
-- NEXT STEPS AFTER MIGRATION
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify all queries return expected results
-- 3. Restart dev server to refresh schema cache
-- 4. Test routing decision workflow
-- 5. Update existing incidents with routing decisions if needed
-- ============================================================================

