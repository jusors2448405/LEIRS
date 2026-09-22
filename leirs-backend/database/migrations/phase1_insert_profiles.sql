-- ============================================================================
-- LEIRS AUTHENTICATION MIGRATION - PHASE 1: INSERT PROFILES
-- ============================================================================
-- Version: v2.1 FINAL
-- Date: 2026-08-25
-- Project: LEIRS REVISE
--
-- IMPORTANT: Run this ONLY AFTER creating 6 users in Supabase Auth Dashboard
--
-- PREREQUISITE:
-- 1. You must have created 6 users in Supabase Dashboard → Authentication → Users
-- 2. Replace <AUTH_USER_ID> placeholders below with actual auth.users IDs
--
-- HOW TO GET AUTH USER IDs:
-- Go to Supabase Dashboard → Authentication → Users
-- Copy the UUID for each user you created
--
-- SECURITY: No plaintext passwords in this file
-- Passwords are managed securely by Supabase Auth
-- ============================================================================

-- ============================================================================
-- VERIFY AUTH USERS EXIST FIRST
-- ============================================================================
-- Run this query in Supabase SQL Editor to see your Auth users:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
-- ============================================================================

-- ============================================================================
-- INSERT PROFILES FOR THE 6 DEFAULT LEIRS USERS
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Create each user in Supabase Dashboard → Authentication → Users
-- 2. Copy the auth user ID
-- 3. Replace <AUTH_USER_ID_X> with the actual ID
-- 4. Run this SQL
-- ============================================================================

-- System Administrator
-- Email: sysadmin@leirs.com
-- Replace <AUTH_USER_ID_SYSADMIN> with actual ID from auth.users
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES (
  '<AUTH_USER_ID_SYSADMIN>'::UUID,
  'sysadmin@leirs.com',
  'Carlos Mendoza',
  'system_admin',
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Incident Administrator
-- Email: incident@leirs.com
-- Replace <AUTH_USER_ID_INCIDENT> with actual ID from auth.users
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES (
  '<AUTH_USER_ID_INCIDENT>'::UUID,
  'incident@leirs.com',
  'Maria Santos',
  'incident_admin',
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Case Administrator
-- Email: caseadmin@leirs.com
-- Replace <AUTH_USER_ID_CASE> with actual ID from auth.users
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES (
  '<AUTH_USER_ID_CASE>'::UUID,
  'caseadmin@leirs.com',
  'Juan Reyes',
  'case_admin',
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Dispatch Administrator
-- Email: dispatch@leirs.com
-- Replace <AUTH_USER_ID_DISPATCH> with actual ID from auth.users
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES (
  '<AUTH_USER_ID_DISPATCH>'::UUID,
  'dispatch@leirs.com',
  'Ana Cruz',
  'dispatch_admin',
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Evidence Administrator
-- Email: evidence@leirs.com
-- Replace <AUTH_USER_ID_EVIDENCE> with actual ID from auth.users
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES (
  '<AUTH_USER_ID_EVIDENCE>'::UUID,
  'evidence@leirs.com',
  'Roberto Garcia',
  'evidence_admin',
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Status Administrator
-- Email: status@leirs.com
-- Replace <AUTH_USER_ID_STATUS> with actual ID from auth.users
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES (
  '<AUTH_USER_ID_STATUS>'::UUID,
  'status@leirs.com',
  'Elena Torres',
  'status_admin',
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- ============================================================================
-- VERIFY PROFILES INSERTED
-- ============================================================================

-- Check all profiles
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  created_at
FROM public.profiles
ORDER BY 
  CASE role
    WHEN 'system_admin' THEN 1
    WHEN 'incident_admin' THEN 2
    WHEN 'case_admin' THEN 3
    WHEN 'dispatch_admin' THEN 4
    WHEN 'evidence_admin' THEN 5
    WHEN 'status_admin' THEN 6
  END;

-- Verify count (should be 6)
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Verify all are active
SELECT COUNT(*) as active_profiles FROM public.profiles WHERE status = 'Active';

-- Verify all roles present
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;

-- ============================================================================
-- PROFILE INSERTION COMPLETE
-- ============================================================================
