-- ============================================================================
-- LEIRS AUTHENTICATION MIGRATION - CREATE AUTH USERS AND PROFILES
-- ============================================================================
-- Version: v1.0
-- Purpose: Create 6 admin users in Supabase Auth with hashed passwords
--          and corresponding profiles in public.profiles table
-- 
-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor
-- 2. Script will create auth.users entries with hashed passwords
-- 3. Script will automatically create corresponding profiles
-- 4. Users can immediately log in with the credentials below
--
-- SECURITY NOTES:
-- - Passwords are hashed by Supabase Auth (bcrypt)
-- - No plaintext passwords stored in database
-- - Each user gets unique UUID from auth.users
-- - profiles.id references auth.users.id (CASCADE on delete)
-- ============================================================================

-- ============================================================================
-- DEFAULT USER CREDENTIALS
-- ============================================================================
-- 1. System Administrator
--    Email:    sysadmin@leirs.com
--    Password: sysadmin123
--    Role:     system_admin
--
-- 2. Incident Admin
--    Email:    incident@leirs.com
--    Password: incident123
--    Role:     incident_admin
--
-- 3. Case Admin
--    Email:    caseadmin@leirs.com
--    Password: case123
--    Role:     case_admin
--
-- 4. Dispatch Admin
--    Email:    dispatch@leirs.com
--    Password: dispatch123
--    Role:     dispatch_admin
--
-- 5. Evidence Admin
--    Email:    evidence@leirs.com
--    Password: evidence123
--    Role:     evidence_admin
--
-- 6. Status Admin
--    Email:    status@leirs.com
--    Password: status123
--    Role:     status_admin
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Create user with profile
-- ============================================================================
CREATE OR REPLACE FUNCTION create_leirs_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Generate UUID for new user
  v_user_id := gen_random_uuid();
  
  -- Hash the password using Supabase Auth's crypt function
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Insert into auth.users table
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_password,
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_full_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Insert corresponding profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_role,
    'Active',
    NOW(),
    NOW()
  );
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE THE 6 LEIRS ADMIN USERS
-- ============================================================================

DO $$
DECLARE
  user_id_1 UUID;
  user_id_2 UUID;
  user_id_3 UUID;
  user_id_4 UUID;
  user_id_5 UUID;
  user_id_6 UUID;
BEGIN
  -- Check if users already exist, skip if they do
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'sysadmin@leirs.com') THEN
    RAISE NOTICE 'Users already exist. Skipping creation.';
    RAISE NOTICE 'To recreate users, delete them first from Supabase Auth Dashboard.';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating 6 LEIRS admin users...';
  
  -- 1. System Administrator
  user_id_1 := create_leirs_user(
    'sysadmin@leirs.com',
    'sysadmin123',
    'Carlos Mendoza',
    'system_admin'
  );
  RAISE NOTICE '✓ Created system_admin: sysadmin@leirs.com (ID: %)', user_id_1;
  
  -- 2. Incident Admin
  user_id_2 := create_leirs_user(
    'incident@leirs.com',
    'incident123',
    'Ana Garcia',
    'incident_admin'
  );
  RAISE NOTICE '✓ Created incident_admin: incident@leirs.com (ID: %)', user_id_2;
  
  -- 3. Case Admin
  user_id_3 := create_leirs_user(
    'caseadmin@leirs.com',
    'case123',
    'Roberto Cruz',
    'case_admin'
  );
  RAISE NOTICE '✓ Created case_admin: caseadmin@leirs.com (ID: %)', user_id_3;
  
  -- 4. Dispatch Admin
  user_id_4 := create_leirs_user(
    'dispatch@leirs.com',
    'dispatch123',
    'Elena Torres',
    'dispatch_admin'
  );
  RAISE NOTICE '✓ Created dispatch_admin: dispatch@leirs.com (ID: %)', user_id_4;
  
  -- 5. Evidence Admin
  user_id_5 := create_leirs_user(
    'evidence@leirs.com',
    'evidence123',
    'Miguel Ramos',
    'evidence_admin'
  );
  RAISE NOTICE '✓ Created evidence_admin: evidence@leirs.com (ID: %)', user_id_5;
  
  -- 6. Status Admin
  user_id_6 := create_leirs_user(
    'status@leirs.com',
    'status123',
    'Sofia Diaz',
    'status_admin'
  );
  RAISE NOTICE '✓ Created status_admin: status@leirs.com (ID: %)', user_id_6;
  
  RAISE NOTICE '================================';
  RAISE NOTICE 'SUCCESS: All 6 users created!';
  RAISE NOTICE '================================';
END $$;

-- ============================================================================
-- VERIFY USERS CREATED
-- ============================================================================

-- View all created users
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  p.status,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  u.created_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email LIKE '%@leirs.com'
ORDER BY 
  CASE p.role
    WHEN 'system_admin' THEN 1
    WHEN 'incident_admin' THEN 2
    WHEN 'case_admin' THEN 3
    WHEN 'dispatch_admin' THEN 4
    WHEN 'evidence_admin' THEN 5
    WHEN 'status_admin' THEN 6
  END;

-- ============================================================================
-- CLEANUP: Drop helper function (optional)
-- ============================================================================
-- Uncomment to remove the helper function after users are created
-- DROP FUNCTION IF EXISTS create_leirs_user(TEXT, TEXT, TEXT, TEXT);

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Verify users appear in Supabase Auth Dashboard
-- 2. Test login with each credential in LEIRS frontend
-- 3. Verify role-based routing works for all 6 roles
-- 4. Test 30-minute idle timeout feature
-- 5. Change default passwords in production environment
-- ============================================================================
