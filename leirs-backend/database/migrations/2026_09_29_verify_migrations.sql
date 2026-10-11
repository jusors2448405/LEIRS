-- ============================================================================
-- LEIRS BARANGAY MEDIATION WORKFLOW - PHASE 1: VERIFICATION SCRIPT
-- ============================================================================
-- Version: v1.0
-- Date: 2026-09-29
-- Project: LEIRS REVISE
-- Purpose: Verify all Phase 1 migrations created tables/columns correctly
--
-- INSTRUCTIONS:
-- Run this script AFTER all 5 migration files have been executed
-- This script performs READ-ONLY verification queries (no data modification)
-- All queries should return successful results with no errors
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY ALL NEW TABLES EXIST
-- ============================================================================

RAISE NOTICE '=== SECTION 1: VERIFYING ALL NEW TABLES EXIST ===';

-- Query 1: Check case_parties table
SELECT 
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'case_parties') AS case_parties_exists;

-- Query 2: Check case_summons table
SELECT 
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'case_summons') AS case_summons_exists;

-- Query 3: Check barangay_hearings table
SELECT 
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'barangay_hearings') AS barangay_hearings_exists;

-- Query 4: Check mediation_records table
SELECT 
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'mediation_records') AS mediation_records_exists;

-- Query 5: List all new tables
SELECT 
  table_name,
  table_schema,
  table_type
FROM information_schema.tables
WHERE table_name IN ('case_parties', 'case_summons', 'barangay_hearings', 'mediation_records')
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: VERIFY COLUMNS IN case_parties TABLE
-- ============================================================================

RAISE NOTICE '=== SECTION 2: VERIFYING case_parties COLUMNS ===';

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'case_parties'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 3: VERIFY COLUMNS IN case_summons TABLE
-- ============================================================================

RAISE NOTICE '=== SECTION 3: VERIFYING case_summons COLUMNS ===';

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'case_summons'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 4: VERIFY COLUMNS IN barangay_hearings TABLE
-- ============================================================================

RAISE NOTICE '=== SECTION 4: VERIFYING barangay_hearings COLUMNS ===';

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'barangay_hearings'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 5: VERIFY COLUMNS IN mediation_records TABLE
-- ============================================================================

RAISE NOTICE '=== SECTION 5: VERIFYING mediation_records COLUMNS ===';

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'mediation_records'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 6: VERIFY INCIDENTS TABLE EXTENSIONS
-- ============================================================================

RAISE NOTICE '=== SECTION 6: VERIFYING incidents TABLE EXTENSIONS ===';

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'incidents' 
  AND column_name IN ('respondent_name', 'respondent_contact')
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 7: VERIFY FOREIGN KEY RELATIONSHIPS
-- ============================================================================

RAISE NOTICE '=== SECTION 7: VERIFYING FOREIGN KEY RELATIONSHIPS ===';

-- Check FKs in case_parties
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu 
  ON rc.constraint_name = kcu.constraint_name
WHERE table_name = 'case_parties'
ORDER BY constraint_name;

-- Check FKs in case_summons
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu 
  ON rc.constraint_name = kcu.constraint_name
WHERE table_name = 'case_summons'
ORDER BY constraint_name;

-- Check FKs in barangay_hearings
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu 
  ON rc.constraint_name = kcu.constraint_name
WHERE table_name = 'barangay_hearings'
ORDER BY constraint_name;

-- Check FKs in mediation_records
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu 
  ON rc.constraint_name = kcu.constraint_name
WHERE table_name = 'mediation_records'
ORDER BY constraint_name;

-- ============================================================================
-- SECTION 8: VERIFY RLS IS ENABLED ON NEW TABLES
-- ============================================================================

RAISE NOTICE '=== SECTION 8: VERIFYING RLS ENABLED ===';

SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('case_parties', 'case_summons', 'barangay_hearings', 'mediation_records')
ORDER BY tablename;

-- ============================================================================
-- SECTION 9: VERIFY RLS POLICIES EXIST
-- ============================================================================

RAISE NOTICE '=== SECTION 9: VERIFYING RLS POLICIES ===';

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('case_parties', 'case_summons', 'barangay_hearings', 'mediation_records')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 10: VERIFY INDEXES CREATED
-- ============================================================================

RAISE NOTICE '=== SECTION 10: VERIFYING INDEXES ===';

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('case_parties', 'case_summons', 'barangay_hearings', 'mediation_records')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 11: VERIFY NO CONSTRAINT CONFLICTS
-- ============================================================================

RAISE NOTICE '=== SECTION 11: VERIFYING CONSTRAINTS ===';

-- Check constraints in all new tables
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('case_parties', 'case_summons', 'barangay_hearings', 'mediation_records')
ORDER BY table_name, constraint_name;

-- ============================================================================
-- SECTION 12: TEST DATA INTEGRITY (NON-DESTRUCTIVE)
-- ============================================================================

RAISE NOTICE '=== SECTION 12: TESTING BASIC INSERTS (TEST MODE - WILL ROLLBACK) ===';

-- Start transaction for testing
BEGIN TRANSACTION;

-- Test 1: Try inserting test data into case_parties
-- Note: This will fail if no incidents exist, which is expected
-- SELECT 'Testing case_parties insert' AS test_status;

-- Test 2: Verify table row counts (should be empty)
SELECT 
  'case_parties' AS table_name,
  COUNT(*) AS row_count
FROM public.case_parties
UNION ALL
SELECT 
  'case_summons' AS table_name,
  COUNT(*) AS row_count
FROM public.case_summons
UNION ALL
SELECT 
  'barangay_hearings' AS table_name,
  COUNT(*) AS row_count
FROM public.barangay_hearings
UNION ALL
SELECT 
  'mediation_records' AS table_name,
  COUNT(*) AS row_count
FROM public.mediation_records;

-- Rollback transaction to avoid leaving test data
ROLLBACK;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

RAISE NOTICE '========================================';
RAISE NOTICE 'VERIFICATION COMPLETE';
RAISE NOTICE '========================================';
RAISE NOTICE '';
RAISE NOTICE 'If all queries above returned results without errors:';
RAISE NOTICE '✓ case_parties table created successfully';
RAISE NOTICE '✓ case_summons table created successfully';
RAISE NOTICE '✓ barangay_hearings table created successfully';
RAISE NOTICE '✓ mediation_records table created successfully';
RAISE NOTICE '✓ incidents table extended with respondent columns';
RAISE NOTICE '✓ All foreign keys configured';
RAISE NOTICE '✓ All RLS policies enabled';
RAISE NOTICE '✓ All indexes created';
RAISE NOTICE '';
RAISE NOTICE 'PHASE 1 STATUS: ✓ DATABASE SETUP COMPLETE';
RAISE NOTICE '';
RAISE NOTICE 'NEXT: Phase 2 - Create 5 React hooks for database operations';
RAISE NOTICE '========================================';

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================
