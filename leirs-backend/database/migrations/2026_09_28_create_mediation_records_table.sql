-- ============================================================================
-- LEIRS BARANGAY MEDIATION WORKFLOW - PHASE 1: CREATE MEDIATION RECORDS TABLE
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-28
-- Project: LEIRS REVISE
-- Purpose: Track mediation attempts and outcomes (Lupon process)
--
-- SCOPE:
-- - Creates mediation_records table to log formal mediation sessions
-- - Tracks mediator name, mediation date, outcome
-- - Records outcome: Success, Partial, Failed
-- - Supports detailed notes about mediation proceedings
--
-- DOES NOT TOUCH:
-- - incidents table
-- - case_parties table
-- - case_summons table
-- - barangay_hearings table
-- - profiles table
-- - Any existing operational data
-- ============================================================================

-- ============================================================================
-- CREATE mediation_records TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mediation_records (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  
  -- Mediation Details
  mediator_name TEXT NOT NULL,
  mediation_date DATE NOT NULL,
  mediation_time TIME,
  
  -- Mediation Outcome
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('Success', 'Partial', 'Failed')),
  
  -- Settlement Information (if Success or Partial)
  agreement_text TEXT,
  settlement_amount DECIMAL(10, 2),
  agreed_terms TEXT,
  
  -- Attendees
  complainant_present BOOLEAN DEFAULT FALSE,
  respondent_present BOOLEAN DEFAULT FALSE,
  
  -- Notes and Documentation
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX idx_mediation_records_incident_id ON public.mediation_records(incident_id);
CREATE INDEX idx_mediation_records_mediation_date ON public.mediation_records(mediation_date);
CREATE INDEX idx_mediation_records_outcome ON public.mediation_records(outcome);
CREATE INDEX idx_mediation_records_incident_outcome ON public.mediation_records(incident_id, outcome);

-- Comment on table
COMMENT ON TABLE public.mediation_records IS 'Records formal mediation/Lupon sessions and outcomes in the barangay resolution workflow';
COMMENT ON COLUMN public.mediation_records.id IS 'Unique identifier for the mediation record';
COMMENT ON COLUMN public.mediation_records.incident_id IS 'Reference to the incident being mediated';
COMMENT ON COLUMN public.mediation_records.mediator_name IS 'Name or title of the mediator/Lupon member';
COMMENT ON COLUMN public.mediation_records.mediation_date IS 'Date of the mediation session';
COMMENT ON COLUMN public.mediation_records.mediation_time IS 'Time of the mediation session';
COMMENT ON COLUMN public.mediation_records.outcome IS 'Outcome: Success (full settlement), Partial (partial settlement), or Failed (no settlement)';
COMMENT ON COLUMN public.mediation_records.agreement_text IS 'Full text of any settlement agreement reached';
COMMENT ON COLUMN public.mediation_records.settlement_amount IS 'Monetary settlement if applicable';
COMMENT ON COLUMN public.mediation_records.agreed_terms IS 'Other terms agreed upon (non-monetary)';
COMMENT ON COLUMN public.mediation_records.complainant_present IS 'Whether complainant participated in mediation';
COMMENT ON COLUMN public.mediation_records.respondent_present IS 'Whether respondent participated in mediation';
COMMENT ON COLUMN public.mediation_records.notes IS 'Detailed notes about mediation proceedings and discussions';
COMMENT ON COLUMN public.mediation_records.created_by IS 'User who created this mediation record';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.mediation_records ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "mediation_records_case_admin_select" ON public.mediation_records;
DROP POLICY IF EXISTS "mediation_records_case_admin_insert" ON public.mediation_records;
DROP POLICY IF EXISTS "mediation_records_case_admin_update" ON public.mediation_records;
DROP POLICY IF EXISTS "mediation_records_system_admin_all" ON public.mediation_records;
DROP POLICY IF EXISTS "mediation_records_status_admin_select" ON public.mediation_records;
DROP POLICY IF EXISTS "mediation_records_dispatch_admin_select" ON public.mediation_records;

-- SELECT Policies
-- Case admin can view all mediation_records
CREATE POLICY "mediation_records_case_admin_select"
ON public.mediation_records
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- Status admin can view mediation_records (for monitoring)
CREATE POLICY "mediation_records_status_admin_select"
ON public.mediation_records
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['status_admin']));

-- Dispatch admin can view mediation_records (for PNP referral coordination)
CREATE POLICY "mediation_records_dispatch_admin_select"
ON public.mediation_records
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['dispatch_admin']));

-- System admin can view all mediation_records
CREATE POLICY "mediation_records_system_admin_select"
ON public.mediation_records
FOR SELECT
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- INSERT Policies
-- Case admin can insert mediation_records for incidents
CREATE POLICY "mediation_records_case_admin_insert"
ON public.mediation_records
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_any_role(auth.uid(), ARRAY['case_admin']) AND
  EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_id)
);

-- System admin can insert mediation_records
CREATE POLICY "mediation_records_system_admin_insert"
ON public.mediation_records
FOR INSERT
TO authenticated
WITH CHECK (private.is_system_admin(auth.uid()));

-- UPDATE Policies
-- Case admin can update mediation_records
CREATE POLICY "mediation_records_case_admin_update"
ON public.mediation_records
FOR UPDATE
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']))
WITH CHECK (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- System admin can update mediation_records
CREATE POLICY "mediation_records_system_admin_update"
ON public.mediation_records
FOR UPDATE
TO authenticated
USING (private.is_system_admin(auth.uid()))
WITH CHECK (private.is_system_admin(auth.uid()));

-- DELETE Policies
-- Only system admin can delete mediation_records
CREATE POLICY "mediation_records_system_admin_delete"
ON public.mediation_records
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
WHERE table_name = 'mediation_records'
ORDER BY ordinal_position;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify table created successfully with verification query above
-- 3. Proceed to extend incidents table with respondent columns (next migration)
-- ============================================================================
