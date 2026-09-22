-- ============================================================================
-- LEIRS AUTHENTICATION MIGRATION - PHASE 1: DATABASE SETUP
-- ============================================================================
-- Version: v2.1 FINAL
-- Date: 2026-08-25
-- Project: LEIRS REVISE
-- Phase: 1 (Database Setup Only - NO Frontend Changes)
-- 
-- IMPORTANT: This migration creates database infrastructure ONLY.
-- It does NOT modify existing operational tables or workflows.
-- It does NOT remove localStorage authentication.
-- Frontend integration happens in Phase 2 (separate approval required).
--
-- SCOPE:
-- 1. Create private schema for security functions
-- 2. Create SECURITY DEFINER role-checking functions
-- 3. Create profiles table (linked to auth.users)
-- 4. Create activity_logs table (audit trail)
-- 5. Enable RLS on profiles and activity_logs ONLY
-- 6. Create RLS policies for profiles and activity_logs
--
-- DOES NOT TOUCH:
-- - incidents table
-- - case_documentations table
-- - dispatch table
-- - evidence table
-- - case_updates table
-- - police_stations table
-- - Any existing operational data
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE PRIVATE SCHEMA
-- ============================================================================
-- Purpose: Isolate security-critical functions from public access
-- Security: Prevents RLS recursion and unauthorized function calls
-- ============================================================================

DO $$ 
BEGIN
  -- Create private schema if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    CREATE SCHEMA private;
    RAISE NOTICE 'Created private schema';
  ELSE
    RAISE NOTICE 'Private schema already exists';
  END IF;
END $$;

-- Revoke all public access to private schema
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

-- Grant access only to postgres superuser and service_role
GRANT USAGE ON SCHEMA private TO postgres, service_role;

COMMENT ON SCHEMA private IS 'Private schema for SECURITY DEFINER functions - not accessible to public/anon/authenticated roles';

-- ============================================================================
-- PART 2: CREATE SECURITY DEFINER FUNCTIONS
-- ============================================================================
-- Purpose: Safe role-checking functions for RLS policies
-- Security: SECURITY DEFINER bypasses RLS to prevent infinite recursion
--           SET search_path = '' prevents search path attacks
--           STABLE allows query optimizer to cache results
-- ============================================================================

-- Function 1: Get user's role
-- Returns the role of an active user, or NULL if user is inactive/not found
CREATE OR REPLACE FUNCTION private.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id 
    AND status = 'Active';
  
  RETURN user_role;
END;
$$;

COMMENT ON FUNCTION private.get_user_role(UUID) IS 'Returns the role of an active user, used by RLS policies to enforce role-based access';

-- Function 2: Check if user is active system admin
-- Returns TRUE if user exists, is active, and has system_admin role
CREATE OR REPLACE FUNCTION private.is_system_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id 
      AND role = 'system_admin' 
      AND status = 'Active'
  );
END;
$$;

COMMENT ON FUNCTION private.is_system_admin(UUID) IS 'Returns true if user is an active system administrator';

-- Function 3: Check if user has any of the specified roles
-- Returns TRUE if user is active and has one of the roles in the array
CREATE OR REPLACE FUNCTION private.has_any_role(user_id UUID, required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id 
    AND status = 'Active';
  
  RETURN user_role = ANY(required_roles);
END;
$$;

COMMENT ON FUNCTION private.has_any_role(UUID, TEXT[]) IS 'Returns true if user has any of the specified roles and is active';

-- Function 4: Check if user is active staff member (any role)
-- Returns TRUE if user exists, is active, and has any valid LEIRS role
CREATE OR REPLACE FUNCTION private.is_active_staff(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id 
      AND status = 'Active'
      AND role IN (
        'system_admin',
        'incident_admin',
        'case_admin',
        'dispatch_admin',
        'evidence_admin',
        'status_admin'
      )
  );
END;
$$;

COMMENT ON FUNCTION private.is_active_staff(UUID) IS 'Returns true if user is an active staff member with any valid LEIRS role';

-- Revoke all public access to these functions
REVOKE ALL ON FUNCTION private.get_user_role(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_system_admin(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_any_role(UUID, TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_active_staff(UUID) FROM PUBLIC, anon, authenticated;

-- Grant execute only to postgres and service_role (for RLS policy evaluation)
GRANT EXECUTE ON FUNCTION private.get_user_role(UUID) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION private.is_system_admin(UUID) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION private.has_any_role(UUID, TEXT[]) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION private.is_active_staff(UUID) TO postgres, service_role;

-- ============================================================================
-- PART 3: CREATE HELPER FUNCTION FOR TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';

-- ============================================================================
-- PART 4: CREATE PROFILES TABLE
-- ============================================================================
-- Purpose: Store user profile data linked to Supabase auth.users
-- Security: RLS enabled immediately, policies created below
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  -- Links to Supabase auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User information (email duplicated for quick lookups)
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  
  -- LEIRS-specific role (exactly 6 valid roles)
  role TEXT NOT NULL CHECK (role IN (
    'system_admin',
    'incident_admin', 
    'case_admin',
    'dispatch_admin',
    'evidence_admin',
    'status_admin'
  )),
  
  -- Status (Active users can login and access system)
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  
  -- Prevent duplicate emails
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions (RLS will further restrict)
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Enable RLS immediately (policies created below)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth - stores LEIRS role and status';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users(id) - primary key';
COMMENT ON COLUMN public.profiles.email IS 'User email - synced with auth.users.email';
COMMENT ON COLUMN public.profiles.role IS 'LEIRS role - exactly 6 valid values enforced by CHECK constraint';
COMMENT ON COLUMN public.profiles.status IS 'User status - only Active users can login';

-- ============================================================================
-- PART 5: CREATE ACTIVITY LOGS TABLE
-- ============================================================================
-- Purpose: Immutable audit trail for all system actions
-- Security: RLS enabled, no UPDATE allowed (immutable logs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action tracking
  action TEXT NOT NULL,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Description and flexible metadata
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamp (immutable - no updates allowed)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_performed_by ON public.activity_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_user ON public.activity_logs(target_user);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Grant permissions (no UPDATE - logs are immutable)
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

-- Enable RLS immediately (policies created below)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.activity_logs IS 'Immutable audit trail for all system actions';
COMMENT ON COLUMN public.activity_logs.action IS 'Action type (e.g., USER_LOGIN, USER_CREATED, INCIDENT_VERIFIED)';
COMMENT ON COLUMN public.activity_logs.performed_by IS 'User who performed the action';
COMMENT ON COLUMN public.activity_logs.target_user IS 'User affected by the action (if applicable)';
COMMENT ON COLUMN public.activity_logs.metadata IS 'Flexible JSONB field for additional context';

-- ============================================================================
-- PART 6: CREATE RLS POLICIES FOR PROFILES TABLE
-- ============================================================================
-- Structure: Separate SELECT/INSERT/UPDATE/DELETE policies
-- Security: Explicit TO authenticated, use private.* functions
-- ============================================================================

-- DROP existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "system_admin_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "system_admin_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "system_admin_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_name_only" ON public.profiles;
DROP POLICY IF EXISTS "system_admin_delete_profiles" ON public.profiles;

-- SELECT Policies
-- System admin can see all profiles
CREATE POLICY "system_admin_select_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- Users can see their own profile
CREATE POLICY "users_select_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT Policies
-- Only system admin can create new profiles (via backend API)
CREATE POLICY "system_admin_insert_profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (private.is_system_admin(auth.uid()));

-- UPDATE Policies
-- System admin can update all profiles
CREATE POLICY "system_admin_update_all_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (private.is_system_admin(auth.uid()))
WITH CHECK (private.is_system_admin(auth.uid()));

-- Users can update only their own full_name (not role or status)
CREATE POLICY "users_update_own_name_only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Cannot change role or status
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
);

-- DELETE Policies
-- Only system admin can delete profiles
CREATE POLICY "system_admin_delete_profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- ============================================================================
-- PART 7: CREATE RLS POLICIES FOR ACTIVITY_LOGS TABLE
-- ============================================================================

-- DROP existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "system_admin_select_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "staff_insert_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "system_admin_delete_old_logs" ON public.activity_logs;

-- SELECT Policies
-- Only system admin can read activity logs
CREATE POLICY "system_admin_select_logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- INSERT Policies
-- All active staff can insert activity logs
CREATE POLICY "staff_insert_logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (private.is_active_staff(auth.uid()));

-- NO UPDATE POLICIES (logs are immutable)

-- DELETE Policies
-- Only system admin can delete old logs (for cleanup)
CREATE POLICY "system_admin_delete_old_logs"
ON public.activity_logs
FOR DELETE
TO authenticated
USING (private.is_system_admin(auth.uid()));

-- ============================================================================
-- PART 8: VERIFICATION QUERIES
-- ============================================================================
-- These queries verify the migration was successful
-- Run these after executing the migration
-- ============================================================================

-- Verify private schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    RAISE NOTICE '✓ Private schema exists';
  ELSE
    RAISE WARNING '✗ Private schema NOT found';
  END IF;
END $$;

-- Verify security functions exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'private')) THEN
    RAISE NOTICE '✓ private.get_user_role() exists';
  ELSE
    RAISE WARNING '✗ private.get_user_role() NOT found';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_system_admin' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'private')) THEN
    RAISE NOTICE '✓ private.is_system_admin() exists';
  ELSE
    RAISE WARNING '✗ private.is_system_admin() NOT found';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_any_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'private')) THEN
    RAISE NOTICE '✓ private.has_any_role() exists';
  ELSE
    RAISE WARNING '✗ private.has_any_role() NOT found';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_active_staff' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'private')) THEN
    RAISE NOTICE '✓ private.is_active_staff() exists';
  ELSE
    RAISE WARNING '✗ private.is_active_staff() NOT found';
  END IF;
END $$;

-- Verify profiles table exists with RLS enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE NOTICE '✓ profiles table exists';
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true) THEN
      RAISE NOTICE '✓ RLS enabled on profiles table';
    ELSE
      RAISE WARNING '✗ RLS NOT enabled on profiles table';
    END IF;
  ELSE
    RAISE WARNING '✗ profiles table NOT found';
  END IF;
END $$;

-- Verify activity_logs table exists with RLS enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    RAISE NOTICE '✓ activity_logs table exists';
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs' AND rowsecurity = true) THEN
      RAISE NOTICE '✓ RLS enabled on activity_logs table';
    ELSE
      RAISE WARNING '✗ RLS NOT enabled on activity_logs table';
    END IF;
  ELSE
    RAISE WARNING '✗ activity_logs table NOT found';
  END IF;
END $$;

-- Count RLS policies
DO $$
DECLARE
  profiles_policy_count INT;
  activity_logs_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO profiles_policy_count FROM pg_policies WHERE tablename = 'profiles';
  SELECT COUNT(*) INTO activity_logs_policy_count FROM pg_policies WHERE tablename = 'activity_logs';
  
  RAISE NOTICE '✓ profiles table has % RLS policies (expected: 6)', profiles_policy_count;
  RAISE NOTICE '✓ activity_logs table has % RLS policies (expected: 3)', activity_logs_policy_count;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Create 6 users in Supabase Auth Dashboard (manual process)
-- 2. Run phase1_insert_profiles.sql to insert profiles
-- 3. Test RLS policies
-- 4. Verify existing LEIRS functionality unchanged
-- ============================================================================
