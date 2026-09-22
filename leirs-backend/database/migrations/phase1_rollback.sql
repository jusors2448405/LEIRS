-- ============================================================================
-- LEIRS AUTHENTICATION MIGRATION - PHASE 1: ROLLBACK
-- ============================================================================
-- Version: v2.1 FINAL
-- Date: 2026-08-25
-- Project: LEIRS REVISE
--
-- PURPOSE: Completely undo Phase 1 changes
-- WARNING: This will delete profiles and activity_logs tables
-- Run ONLY if you need to rollback Phase 1
-- ============================================================================

-- ============================================================================
-- BACKUP REMINDER
-- ============================================================================
-- Before running this rollback:
-- 1. Export profiles data: SELECT * FROM public.profiles;
-- 2. Export activity_logs data: SELECT * FROM public.activity_logs;
-- 3. Save to CSV or backup file
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP RLS POLICIES
-- ============================================================================

-- Drop profiles policies
DROP POLICY IF EXISTS "system_admin_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "system_admin_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "system_admin_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_name_only" ON public.profiles;
DROP POLICY IF EXISTS "system_admin_delete_profiles" ON public.profiles;

-- Drop activity_logs policies
DROP POLICY IF EXISTS "system_admin_select_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "staff_insert_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "system_admin_delete_old_logs" ON public.activity_logs;

RAISE NOTICE '✓ RLS policies dropped';

-- ============================================================================
-- STEP 2: DROP TABLES
-- ============================================================================

-- Drop activity_logs table (must drop before profiles due to foreign key)
DROP TABLE IF EXISTS public.activity_logs CASCADE;
RAISE NOTICE '✓ activity_logs table dropped';

-- Drop profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;
RAISE NOTICE '✓ profiles table dropped';

-- ============================================================================
-- STEP 3: DROP SECURITY FUNCTIONS
-- ============================================================================

-- Drop security definer functions
DROP FUNCTION IF EXISTS private.get_user_role(UUID);
DROP FUNCTION IF EXISTS private.is_system_admin(UUID);
DROP FUNCTION IF EXISTS private.has_any_role(UUID, TEXT[]);
DROP FUNCTION IF EXISTS private.is_active_staff(UUID);

RAISE NOTICE '✓ Security functions dropped';

-- ============================================================================
-- STEP 4: DROP HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
RAISE NOTICE '✓ Helper functions dropped';

-- ============================================================================
-- STEP 5: DROP PRIVATE SCHEMA
-- ============================================================================

-- Drop private schema (will fail if any objects still exist in it)
DROP SCHEMA IF EXISTS private CASCADE;
RAISE NOTICE '✓ Private schema dropped';

-- ============================================================================
-- STEP 6: VERIFY ROLLBACK
-- ============================================================================

-- Check if private schema still exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'private') THEN
    RAISE NOTICE '✓ VERIFIED: Private schema removed';
  ELSE
    RAISE WARNING '✗ WARNING: Private schema still exists';
  END IF;
END $$;

-- Check if profiles table still exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE NOTICE '✓ VERIFIED: profiles table removed';
  ELSE
    RAISE WARNING '✗ WARNING: profiles table still exists';
  END IF;
END $$;

-- Check if activity_logs table still exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    RAISE NOTICE '✓ VERIFIED: activity_logs table removed';
  ELSE
    RAISE WARNING '✗ WARNING: activity_logs table still exists';
  END IF;
END $$;

-- Verify operational tables unchanged
SELECT 
  'incidents' as table_name,
  COUNT(*) as record_count,
  '✓ Should match pre-migration count' as status
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
-- ROLLBACK COMPLETE
-- ============================================================================

COMMIT;

RAISE NOTICE '====================================';
RAISE NOTICE 'PHASE 1 ROLLBACK COMPLETED';
RAISE NOTICE '====================================';
RAISE NOTICE 'Removed:';
RAISE NOTICE '- private schema';
RAISE NOTICE '- 4 security functions';
RAISE NOTICE '- profiles table';
RAISE NOTICE '- activity_logs table';
RAISE NOTICE '- All RLS policies';
RAISE NOTICE '';
RAISE NOTICE 'Preserved:';
RAISE NOTICE '- All operational tables';
RAISE NOTICE '- All existing data';
RAISE NOTICE '- Supabase Auth users (must delete manually)';
RAISE NOTICE '====================================';

-- ============================================================================
-- POST-ROLLBACK CLEANUP
-- ============================================================================
-- If you created users in Supabase Auth Dashboard, delete them manually:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Delete the 6 LEIRS users:
--    - sysadmin@leirs.com
--    - incident@leirs.com
--    - caseadmin@leirs.com
--    - dispatch@leirs.com
--    - evidence@leirs.com
--    - status@leirs.com
-- ============================================================================
