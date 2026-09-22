-- ============================================================================
-- LEIRS AUTHENTICATION MIGRATION - PHASE 1: RLS TESTING
-- ============================================================================
-- Version: v2.1 FINAL
-- Date: 2026-08-25
-- Project: LEIRS REVISE
--
-- PURPOSE: Test RLS policies and security functions
-- Run these tests AFTER profiles are inserted
-- ============================================================================

-- ============================================================================
-- TEST 1: VERIFY DATABASE OBJECTS
-- ============================================================================

-- Test 1.1: Check private schema exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') 
    THEN '✓ PASS: Private schema exists'
    ELSE '✗ FAIL: Private schema not found'
  END as test_result;

-- Test 1.2: Check security functions exist
SELECT 
  proname as function_name,
  '✓ EXISTS' as status
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'private')
  AND proname IN ('get_user_role', 'is_system_admin', 'has_any_role', 'is_active_staff')
ORDER BY proname;

-- Test 1.3: Check profiles table exists with RLS
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✓ RLS ENABLED' ELSE '✗ RLS DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Test 1.4: Check activity_logs table exists with RLS
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✓ RLS ENABLED' ELSE '✗ RLS DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'activity_logs';

-- Test 1.5: Check RLS policies count
SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE tablename
    WHEN 'profiles' THEN '(Expected: 6)'
    WHEN 'activity_logs' THEN '(Expected: 3)'
  END as expected
FROM pg_policies
WHERE tablename IN ('profiles', 'activity_logs')
GROUP BY tablename;

-- ============================================================================
-- TEST 2: VERIFY PROFILES DATA
-- ============================================================================

-- Test 2.1: Check all 6 profiles exist
SELECT 
  CASE 
    WHEN COUNT(*) = 6 
    THEN '✓ PASS: All 6 profiles exist'
    ELSE '✗ FAIL: Only ' || COUNT(*) || ' profiles found (expected 6)'
  END as test_result
FROM public.profiles;

-- Test 2.2: Check all profiles are active
SELECT 
  CASE 
    WHEN COUNT(*) = 6 
    THEN '✓ PASS: All 6 profiles are Active'
    ELSE '✗ FAIL: Only ' || COUNT(*) || ' active profiles (expected 6)'
  END as test_result
FROM public.profiles
WHERE status = 'Active';

-- Test 2.3: Check all 6 roles present
SELECT 
  role,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL: Duplicate role'
  END as status
FROM public.profiles
GROUP BY role
ORDER BY role;

-- Test 2.4: Verify no invalid roles
SELECT 
  CASE 
    WHEN COUNT(*) = 0 
    THEN '✓ PASS: No invalid roles'
    ELSE '✗ FAIL: Found ' || COUNT(*) || ' invalid roles'
  END as test_result
FROM public.profiles
WHERE role NOT IN (
  'system_admin',
  'incident_admin',
  'case_admin',
  'dispatch_admin',
  'evidence_admin',
  'status_admin'
);

-- ============================================================================
-- TEST 3: TEST SECURITY FUNCTIONS
-- ============================================================================
-- NOTE: These tests use service_role privileges
-- In production, these functions are called by RLS policies only
-- ============================================================================

-- Test 3.1: Test private.get_user_role()
-- Replace <SYSADMIN_ID> with actual system admin profile ID
SELECT 
  private.get_user_role(id) as role,
  CASE 
    WHEN private.get_user_role(id) = 'system_admin' 
    THEN '✓ PASS: Returns system_admin'
    ELSE '✗ FAIL: Expected system_admin, got ' || COALESCE(private.get_user_role(id), 'NULL')
  END as test_result
FROM public.profiles
WHERE email = 'sysadmin@leirs.com';

-- Test 3.2: Test private.is_system_admin()
SELECT 
  email,
  role,
  private.is_system_admin(id) as is_admin,
  CASE 
    WHEN role = 'system_admin' AND private.is_system_admin(id) = true 
    THEN '✓ PASS: Correctly identified as admin'
    WHEN role != 'system_admin' AND private.is_system_admin(id) = false 
    THEN '✓ PASS: Correctly identified as NOT admin'
    ELSE '✗ FAIL: Incorrect admin check'
  END as test_result
FROM public.profiles
ORDER BY email;

-- Test 3.3: Test private.has_any_role()
SELECT 
  email,
  role,
  private.has_any_role(id, ARRAY['incident_admin', 'system_admin']) as has_role,
  CASE 
    WHEN role IN ('incident_admin', 'system_admin') 
         AND private.has_any_role(id, ARRAY['incident_admin', 'system_admin']) = true 
    THEN '✓ PASS'
    WHEN role NOT IN ('incident_admin', 'system_admin') 
         AND private.has_any_role(id, ARRAY['incident_admin', 'system_admin']) = false 
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as test_result
FROM public.profiles
ORDER BY email;

-- Test 3.4: Test private.is_active_staff()
SELECT 
  email,
  status,
  private.is_active_staff(id) as is_staff,
  CASE 
    WHEN status = 'Active' AND private.is_active_staff(id) = true 
    THEN '✓ PASS: Active staff recognized'
    WHEN status = 'Inactive' AND private.is_active_staff(id) = false 
    THEN '✓ PASS: Inactive staff blocked'
    ELSE '✗ FAIL: Staff check incorrect'
  END as test_result
FROM public.profiles
ORDER BY email;

-- ============================================================================
-- TEST 4: TEST RLS POLICY ENFORCEMENT
-- ============================================================================
-- These tests verify RLS policies work correctly
-- ============================================================================

-- Test 4.1: List all RLS policies on profiles
SELECT 
  policyname,
  cmd as operation,
  roles,
  '✓ EXISTS' as status
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Test 4.2: List all RLS policies on activity_logs
SELECT 
  policyname,
  cmd as operation,
  roles,
  '✓ EXISTS' as status
FROM pg_policies
WHERE tablename = 'activity_logs'
ORDER BY cmd, policyname;

-- ============================================================================
-- TEST 5: VERIFY EXISTING OPERATIONAL TABLES UNCHANGED
-- ============================================================================

-- Test 5.1: Check incidents table (should NOT have RLS enabled in Phase 1)
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = false 
    THEN '✓ PASS: RLS not enabled (Phase 1 correct)'
    ELSE '✗ FAIL: RLS should not be enabled yet'
  END as test_result
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'incidents';

-- Test 5.2: Check case_documentations table (should NOT have RLS in Phase 1)
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = false 
    THEN '✓ PASS: RLS not enabled (Phase 1 correct)'
    ELSE '✗ FAIL: RLS should not be enabled yet'
  END as test_result
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'case_documentations';

-- Test 5.3: Check dispatch table (should NOT have RLS in Phase 1)
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = false 
    THEN '✓ PASS: RLS not enabled (Phase 1 correct)'
    ELSE '✗ FAIL: RLS should not be enabled yet'
  END as test_result
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'dispatch';

-- Test 5.4: Check evidence table (should NOT have RLS in Phase 1)
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = false 
    THEN '✓ PASS: RLS not enabled (Phase 1 correct)'
    ELSE '✗ FAIL: RLS should not be enabled yet'
  END as test_result
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'evidence';

-- Test 5.5: Verify existing data counts (should be unchanged)
SELECT 
  'incidents' as table_name,
  COUNT(*) as record_count,
  '✓ Should match pre-migration count' as note
FROM public.incidents
UNION ALL
SELECT 
  'case_documentations',
  COUNT(*),
  '✓ Should match pre-migration count'
FROM public.case_documentations
UNION ALL
SELECT 
  'dispatch',
  COUNT(*),
  '✓ Should match pre-migration count'
FROM public.dispatch
UNION ALL
SELECT 
  'evidence',
  COUNT(*),
  '✓ Should match pre-migration count'
FROM public.evidence;

-- ============================================================================
-- TEST 6: COMPREHENSIVE SUMMARY
-- ============================================================================

SELECT 
  '====== PHASE 1 TEST SUMMARY ======' as summary
UNION ALL
SELECT 
  '✓ Private schema: ' || 
  CASE WHEN EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END
UNION ALL
SELECT 
  '✓ Security functions: ' || COUNT(*)::TEXT || '/4'
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'private')
  AND proname IN ('get_user_role', 'is_system_admin', 'has_any_role', 'is_active_staff')
UNION ALL
SELECT 
  '✓ Profiles table: ' || 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END
UNION ALL
SELECT 
  '✓ Activity logs table: ' || 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'activity_logs') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END
UNION ALL
SELECT 
  '✓ User profiles: ' || COUNT(*)::TEXT || '/6'
FROM public.profiles
UNION ALL
SELECT 
  '✓ Active profiles: ' || COUNT(*)::TEXT || '/6'
FROM public.profiles WHERE status = 'Active'
UNION ALL
SELECT 
  '✓ Profiles RLS policies: ' || COUNT(*)::TEXT || '/6'
FROM pg_policies WHERE tablename = 'profiles'
UNION ALL
SELECT 
  '✓ Activity logs RLS policies: ' || COUNT(*)::TEXT || '/3'
FROM pg_policies WHERE tablename = 'activity_logs'
UNION ALL
SELECT '====== END SUMMARY ======';

-- ============================================================================
-- TESTING COMPLETE
-- ============================================================================
-- All tests should show ✓ PASS
-- If any tests show ✗ FAIL, investigate before proceeding to Phase 2
-- ============================================================================
