-- ============================================================================
-- LEIRS BARANGAY MEDIATION WORKFLOW - CREATE CASE RESOLUTIONS TABLE
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-29
-- Project: LEIRS REVISE
-- Purpose: Track case resolution outcomes and final dispositions
--
-- SCOPE:
-- - Creates case_resolutions table to record final case outcomes
-- - Tracks resolution type, date, description, and recommendations
-- - One resolution per incident (typically the final outcome)
--
-- DOES NOT TOUCH:
-- - incidents table
-- - case_parties table
-- - Other workflow tables
-- - Any existing operational data
-- ============================================================================

-- ============================================================================
-- CREATE case_resolutions TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_resolutions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  incident_id UUID NOT NULL UNIQUE REFERENCES public.incidents(id) ON DELETE CASCADE,
  
  -- Resolution Details
  resolution_type VARCHAR(50) NOT NULL CHECK (resolution_type IN (
    'Mediation Successful',
    'Arbitration',
    'Dismissed',
    'Withdrawn',
    'Referred to Court',
    'Other'
  )),
  resolution_date DATE NOT NULL,
  resolution_description TEXT NOT NULL,
  
  -- Follow-up
  recommendations TEXT,
  
  -- Notification
  complainant_email TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX idx_case_resolutions_incident_id ON public.case_resolutions(incident_id);
CREATE INDEX idx_case_resolutions_type ON public.case_resolutions(resolution_type);
CREATE INDEX idx_case_resolutions_date ON public.case_resolutions(resolution_date DESC);

-- Comment on table
COMMENT ON TABLE public.case_resolutions IS 'Records final case resolutions and outcomes in the barangay mediation workflow';
COMMENT ON COLUMN public.case_resolutions.id IS 'Unique identifier for the resolution record';
COMMENT ON COLUMN public.case_resolutions.incident_id IS 'Reference to the incident (one resolution per incident)';
COMMENT ON COLUMN public.case_resolutions.resolution_type IS 'Type of resolution outcome';
COMMENT ON COLUMN public.case_resolutions.resolution_date IS 'Date the case was resolved';
COMMENT ON COLUMN public.case_resolutions.resolution_description IS 'Detailed description of the resolution outcome';
COMMENT ON COLUMN public.case_resolutions.recommendations IS 'Follow-up recommendations or next steps';
COMMENT ON COLUMN public.case_resolutions.complainant_email IS 'Email address for sending resolution notification';
COMMENT ON COLUMN public.case_resolutions.created_by IS 'User who recorded this resolution';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.case_resolutions ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "case_resolutions_case_admin_select" ON public.case_resolutions;
DROP POLICY IF EXISTS "case_resolutions_case_admin_insert" ON public.case_resolutions;
DROP POLICY IF EXISTS "case_resolutions_case_admin_update" ON public.case_resolutions;
DROP POLICY IF EXISTS "case_resolutions_system_admin_all" ON public.case_resolutions;
DROP POLICY IF EXISTS "case_resolutions_status_admin_select" ON public.case_resolutions;

-- SELECT Policies
-- Case admin can view all resolutions
CREATE POLICY "case_resolutions_case_admin_select"
ON public.case_resolutions
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- Status admin can view resolutions (for monitoring)
CREATE POLICY "case_resolutions_status_admin_select"
ON public.case_resolutions
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['status_admin']));

-- System admin can view all resolutions
CREATE POLICY "case_resolutions_system_admin_select"
ON public.case_resolutions
FOR SELECT
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- INSERT Policies
-- Case admin can insert resolutions
CREATE POLICY "case_resolutions_case_admin_insert"
ON public.case_resolutions
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_any_role(auth.uid(), ARRAY['case_admin'])
);

-- System admin can insert resolutions
CREATE POLICY "case_resolutions_system_admin_insert"
ON public.case_resolutions
FOR INSERT
TO authenticated
WITH CHECK (private.is_system_admin(auth.uid()));

-- UPDATE Policies
-- Case admin can update resolutions
CREATE POLICY "case_resolutions_case_admin_update"
ON public.case_resolutions
FOR UPDATE
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- System admin can update all resolutions
CREATE POLICY "case_resolutions_system_admin_update"
ON public.case_resolutions
FOR UPDATE
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- DELETE Policies
-- Only system admin can delete resolutions
CREATE POLICY "case_resolutions_system_admin_delete"
ON public.case_resolutions
FOR DELETE
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- ============================================================================
-- CREATE TRIGGER FOR updated_at
-- ============================================================================

CREATE TRIGGER update_case_resolutions_updated_at
  BEFORE UPDATE ON public.case_resolutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this query after migration to verify table was created successfully:
/*
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'case_resolutions'
ORDER BY ordinal_position;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
