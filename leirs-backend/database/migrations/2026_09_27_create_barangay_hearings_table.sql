-- ============================================================================
-- LEIRS BARANGAY MEDIATION WORKFLOW - PHASE 1: CREATE BARANGAY HEARINGS TABLE
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-27
-- Project: LEIRS REVISE
-- Purpose: Record barangay hearing details and outcomes
--
-- SCOPE:
-- - Creates barangay_hearings table to track hearing scheduling and results
-- - Tracks scheduled date/time, location, presiding official
-- - Records outcome: Resolved, NotResolved, Cancelled
-- - Supports notes about hearing proceedings
--
-- DOES NOT TOUCH:
-- - incidents table
-- - case_parties table
-- - case_summons table
-- - profiles table
-- - Any existing operational data
-- ============================================================================

-- ============================================================================
-- CREATE barangay_hearings TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.barangay_hearings (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  
  -- Hearing Details
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  location TEXT NOT NULL,
  presiding_official TEXT NOT NULL,
  
  -- Hearing Outcome
  conducted BOOLEAN DEFAULT FALSE,
  conducted_date DATE,
  outcome VARCHAR(20) CHECK (outcome IN ('Resolved', 'NotResolved', 'Cancelled', NULL)),
  
  -- Hearing Information
  attendees_complainant BOOLEAN DEFAULT FALSE,
  attendees_respondent BOOLEAN DEFAULT FALSE,
  attendees_barangay_official BOOLEAN DEFAULT FALSE,
  
  -- Notes and Documentation
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conducted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT barangay_hearings_valid_dates CHECK (
    conducted_date IS NULL OR 
    (conducted_date >= scheduled_date AND conducted = TRUE)
  )
);

-- Create indexes for common queries
CREATE INDEX idx_barangay_hearings_incident_id ON public.barangay_hearings(incident_id);
CREATE INDEX idx_barangay_hearings_scheduled_date ON public.barangay_hearings(scheduled_date);
CREATE INDEX idx_barangay_hearings_outcome ON public.barangay_hearings(outcome);
CREATE INDEX idx_barangay_hearings_conducted ON public.barangay_hearings(conducted);
CREATE INDEX idx_barangay_hearings_incident_conducted ON public.barangay_hearings(incident_id, conducted);

-- Comment on table
COMMENT ON TABLE public.barangay_hearings IS 'Records barangay hearing scheduling and outcomes in the mediation workflow';
COMMENT ON COLUMN public.barangay_hearings.id IS 'Unique identifier for the hearing record';
COMMENT ON COLUMN public.barangay_hearings.incident_id IS 'Reference to the incident being heard';
COMMENT ON COLUMN public.barangay_hearings.scheduled_date IS 'Date scheduled for the hearing';
COMMENT ON COLUMN public.barangay_hearings.scheduled_time IS 'Time scheduled for the hearing';
COMMENT ON COLUMN public.barangay_hearings.location IS 'Physical location where hearing will be held';
COMMENT ON COLUMN public.barangay_hearings.presiding_official IS 'Name/title of official presiding over hearing';
COMMENT ON COLUMN public.barangay_hearings.conducted IS 'Whether the hearing has been conducted';
COMMENT ON COLUMN public.barangay_hearings.conducted_date IS 'Actual date hearing was conducted';
COMMENT ON COLUMN public.barangay_hearings.outcome IS 'Outcome of hearing: Resolved, NotResolved, or Cancelled';
COMMENT ON COLUMN public.barangay_hearings.attendees_complainant IS 'Whether complainant attended';
COMMENT ON COLUMN public.barangay_hearings.attendees_respondent IS 'Whether respondent attended';
COMMENT ON COLUMN public.barangay_hearings.attendees_barangay_official IS 'Whether barangay official attended';
COMMENT ON COLUMN public.barangay_hearings.notes IS 'Detailed notes about hearing proceedings and decisions';
COMMENT ON COLUMN public.barangay_hearings.created_by IS 'User who created this hearing record';
COMMENT ON COLUMN public.barangay_hearings.conducted_by IS 'User who conducted/documented the hearing';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.barangay_hearings ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "barangay_hearings_case_admin_select" ON public.barangay_hearings;
DROP POLICY IF EXISTS "barangay_hearings_case_admin_insert" ON public.barangay_hearings;
DROP POLICY IF EXISTS "barangay_hearings_case_admin_update" ON public.barangay_hearings;
DROP POLICY IF EXISTS "barangay_hearings_system_admin_all" ON public.barangay_hearings;
DROP POLICY IF EXISTS "barangay_hearings_status_admin_select" ON public.barangay_hearings;
DROP POLICY IF EXISTS "barangay_hearings_dispatch_admin_select" ON public.barangay_hearings;

-- SELECT Policies
-- Case admin can view all barangay_hearings
CREATE POLICY "barangay_hearings_case_admin_select"
ON public.barangay_hearings
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- Status admin can view barangay_hearings (for monitoring)
CREATE POLICY "barangay_hearings_status_admin_select"
ON public.barangay_hearings
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['status_admin']));

-- Dispatch admin can view barangay_hearings (for PNP referral coordination)
CREATE POLICY "barangay_hearings_dispatch_admin_select"
ON public.barangay_hearings
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['dispatch_admin']));

-- System admin can view all barangay_hearings
CREATE POLICY "barangay_hearings_system_admin_select"
ON public.barangay_hearings
FOR SELECT
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- INSERT Policies
-- Case admin can insert barangay_hearings for incidents
CREATE POLICY "barangay_hearings_case_admin_insert"
ON public.barangay_hearings
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_any_role(auth.uid(), ARRAY['case_admin']) AND
  EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_id)
);

-- System admin can insert barangay_hearings
CREATE POLICY "barangay_hearings_system_admin_insert"
ON public.barangay_hearings
FOR INSERT
TO authenticated
WITH CHECK (private.is_system_admin(auth.uid()));

-- UPDATE Policies
-- Case admin can update barangay_hearings
CREATE POLICY "barangay_hearings_case_admin_update"
ON public.barangay_hearings
FOR UPDATE
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']))
WITH CHECK (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- System admin can update barangay_hearings
CREATE POLICY "barangay_hearings_system_admin_update"
ON public.barangay_hearings
FOR UPDATE
TO authenticated
USING (private.is_system_admin(auth.uid()))
WITH CHECK (private.is_system_admin(auth.uid()));

-- DELETE Policies
-- Only system admin can delete barangay_hearings
CREATE POLICY "barangay_hearings_system_admin_delete"
ON public.barangay_hearings
FOR DELETE
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'barangay_hearings'
ORDER BY ordinal_position;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify table created successfully with verification query above
-- 3. Proceed to create mediation_records table (next migration)
-- ============================================================================
