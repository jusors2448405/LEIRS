-- ============================================================================
-- LEIRS BARANGAY MEDIATION WORKFLOW - PHASE 1: CREATE CASE PARTIES TABLE
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-25
-- Project: LEIRS REVISE
-- Purpose: Store complainant and respondent information for each incident
--
-- SCOPE:
-- - Creates case_parties table to track complainants and respondents
-- - Supports multiple parties per incident (future enhancement)
-- - Links to incidents table via foreign key
-- - Denormalization support: respondent_name copied to incidents table for speed
--
-- DOES NOT TOUCH:
-- - incidents table (columns added separately in next migration)
-- - profiles table
-- - Any existing operational data
-- ============================================================================

-- ============================================================================
-- CREATE case_parties TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_parties (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  
  -- Party Information
  party_type VARCHAR(20) NOT NULL CHECK (party_type IN ('Complainant', 'Respondent')),
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Indexes for performance
  CONSTRAINT case_parties_unique_complainant UNIQUE (incident_id, party_type, name) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for common queries
CREATE INDEX idx_case_parties_incident_id ON public.case_parties(incident_id);
CREATE INDEX idx_case_parties_party_type ON public.case_parties(party_type);
CREATE INDEX idx_case_parties_incident_type ON public.case_parties(incident_id, party_type);

-- Comment on table
COMMENT ON TABLE public.case_parties IS 'Tracks complainants and respondents for each incident in the barangay mediation workflow';
COMMENT ON COLUMN public.case_parties.id IS 'Unique identifier for the case party';
COMMENT ON COLUMN public.case_parties.incident_id IS 'Reference to the incident this party is involved in';
COMMENT ON COLUMN public.case_parties.party_type IS 'Type of party: Complainant or Respondent';
COMMENT ON COLUMN public.case_parties.name IS 'Name of the complainant or respondent';
COMMENT ON COLUMN public.case_parties.contact IS 'Phone number or contact information';
COMMENT ON COLUMN public.case_parties.email IS 'Email address for notifications';
COMMENT ON COLUMN public.case_parties.created_by IS 'User who created this record';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "case_parties_case_admin_select" ON public.case_parties;
DROP POLICY IF EXISTS "case_parties_case_admin_insert" ON public.case_parties;
DROP POLICY IF EXISTS "case_parties_case_admin_update" ON public.case_parties;
DROP POLICY IF EXISTS "case_parties_system_admin_all" ON public.case_parties;
DROP POLICY IF EXISTS "case_parties_status_admin_select" ON public.case_parties;

-- SELECT Policies
-- Case admin can view all case_parties
CREATE POLICY "case_parties_case_admin_select"
ON public.case_parties
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- Status admin can view case_parties (for monitoring)
CREATE POLICY "case_parties_status_admin_select"
ON public.case_parties
FOR SELECT
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['status_admin']));

-- System admin can view all case_parties
CREATE POLICY "case_parties_system_admin_select"
ON public.case_parties
FOR SELECT
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- INSERT Policies
-- Case admin can insert case_parties for incidents
CREATE POLICY "case_parties_case_admin_insert"
ON public.case_parties
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_any_role(auth.uid(), ARRAY['case_admin']) AND
  EXISTS (SELECT 1 FROM public.incidents WHERE id = incident_id)
);

-- System admin can insert case_parties
CREATE POLICY "case_parties_system_admin_insert"
ON public.case_parties
FOR INSERT
TO authenticated
WITH CHECK (private.is_system_admin(auth.uid()));

-- UPDATE Policies
-- Case admin can update case_parties
CREATE POLICY "case_parties_case_admin_update"
ON public.case_parties
FOR UPDATE
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['case_admin']))
WITH CHECK (private.has_any_role(auth.uid(), ARRAY['case_admin']));

-- System admin can update case_parties
CREATE POLICY "case_parties_system_admin_update"
ON public.case_parties
FOR UPDATE
TO authenticated
USING (private.is_system_admin(auth.uid()))
WITH CHECK (private.is_system_admin(auth.uid()));

-- DELETE Policies
-- Only system admin can delete case_parties
CREATE POLICY "case_parties_system_admin_delete"
ON public.case_parties
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
WHERE table_name = 'case_parties'
ORDER BY ordinal_position;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify table created successfully with verification query above
-- 3. Proceed to create case_summons table (next migration)
-- ============================================================================
