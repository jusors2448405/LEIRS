-- ============================================================================
-- LEIRS BARANGAY MEDIATION WORKFLOW - PHASE 1: CREATE CASE SUMMONS TABLE
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-26
-- Project: LEIRS REVISE
-- Purpose: Track issuance and service of summons to respondents
--
-- SCOPE:
-- - Creates case_summons table to track summons for each respondent
-- - Tracks summons number (UNIQUE), issued date, served date
-- - Maintains status: Issued, Served, NotServed
-- - Supports follow-up summons if respondent not served first time
--
-- DOES NOT TOUCH:
-- - incidents table
-- - case_parties table
-- - profiles table
-- - Any existing operational data
-- ============================================================================

-- ============================================================================
-- CREATE case_summons TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_summons (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES public.case_parties(id) ON DELETE SET NULL,
  
  -- Summons Details
  summons_number VARCHAR(50) NOT NULL UNIQUE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  served_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Served', 'NotServed')),
  
  -- Service Information
  served_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT case_summons_valid_dates CHECK (served_date IS NULL OR served_date >= issued_date)
);

-- Create indexes for common queries
CREATE INDEX idx_case_summons_incident_id ON public.case_summons(incident_id);
CREATE INDEX idx_case_summons_respondent_id ON public.case_summons(respondent_id);
CREATE INDEX idx_case_summons_status ON public.case_summons(status);
CREATE INDEX idx_case_summons_summons_number ON public.case_summons(summons_number);
CREATE INDEX idx_case_summons_incident_status ON public.case_summons(incident_id, status);

-- Comment on table
COMMENT ON TABLE public.case_summons IS 'Tracks summons issuance and service to respondents in barangay mediation workflow';
COMMENT ON COLUMN public.case_summons.id IS 'Unique identifier for the summons record';
COMMENT ON COLUMN public.case_summons.incident_id IS 'Reference to the incident this summons is for';
COMMENT ON COLUMN public.case_summons.respondent_id IS 'Reference to the respondent (case_parties record)';
COMMENT ON COLUMN public.case_summons.summons_number IS 'Unique summons reference number for tracking';
COMMENT ON COLUMN public.case_summons.issued_date IS 'Date summons was issued';
COMMENT ON COLUMN public.case_summons.served_date IS 'Date summons was served to respondent';
COMMENT ON COLUMN public.case_summons.status IS 'Current status: Issued, Served, or NotServed';
COMMENT ON COLUMN public.case_summons.served_by IS 'User who served the summons';
COMMENT ON COLUMN public.case_summons.service_notes IS 'Notes about service attempt (e.g., "Left with neighbor" or "Respondent refused")';
COMMENT ON COLUMN public.case_summons.created_by IS 'User who created this summons record';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.case_summons ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "case_summons_case_admin_select" ON public.case_summons;
DROP POLICY IF EXISTS "case_summons_case_admin_insert" ON public.case_summons;
DROP POLICY IF EXISTS "case_summons_case_admin_update" ON public.case_summons;
DROP POLICY IF EXISTS "case_summons_dispatch_admin_select" ON public.case_summons;
DROP POLICY IF EXISTS "case_summons_dispatch_admin_update" ON public.case_summons;
DROP POLICY IF EXISTS "case_summons_system_admin_all" ON public.case_summons;
DROP POLICY IF EXISTS "case_summons_status_admin_select" ON public.case_summons;

-- SELECT Policies
-- Case admin can view all case_summons
CREATE POLICY "case_summons_case_admin_select"
ON public.case_summons
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- Dispatch admin can view case_summons (for service tracking)
CREATE POLICY "case_summons_dispatch_admin_select"
ON public.case_summons
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['dispatch_admin']));

-- Status admin can view case_summons (for monitoring)
CREATE POLICY "case_summons_status_admin_select"
ON public.case_summons
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['status_admin']));

-- System admin can view all case_summons
CREATE POLICY "case_summons_system_admin_select"
ON public.case_summons
FOR SELECT
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- INSERT Policies
-- Case admin can insert case_summons for incidents
CREATE POLICY "case_summons_case_admin_insert"
ON public.case_summons
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_any_role(auth.uid(), ARRAY['case_admin']) AND
  EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_id)
);

-- System admin can insert case_summons
CREATE POLICY "case_summons_system_admin_insert"
ON public.case_summons
FOR INSERT
TO authenticated
WITH CHECK (private.is_system_admin(auth.uid()));

-- UPDATE Policies
-- Case admin can update case_summons
CREATE POLICY "case_summons_case_admin_update"
ON public.case_summons
FOR UPDATE
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']))
WITH CHECK (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- Dispatch admin can update served_date and status
CREATE POLICY "case_summons_dispatch_admin_update"
ON public.case_summons
FOR UPDATE
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['dispatch_admin']))
WITH CHECK (private.has_any_role(auth.uid(), ARRAY['dispatch_admin']));

-- System admin can update case_summons
CREATE POLICY "case_summons_system_admin_update"
ON public.case_summons
FOR UPDATE
TO authenticated
USING (private.is_system_admin(auth.uid()))
WITH CHECK (private.is_system_admin(auth.uid()));

-- DELETE Policies
-- Only system admin can delete case_summons
CREATE POLICY "case_summons_system_admin_delete"
ON public.case_summons
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
WHERE table_name = 'case_summons'
ORDER BY ordinal_position;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify table created successfully with verification query above
-- 3. Proceed to create barangay_hearings table (next migration)
-- ============================================================================
