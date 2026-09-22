-- ============================================================================
-- LEIRS Password Reset Function
-- ============================================================================
-- Purpose: Reset passwords for the 6 LEIRS admin accounts
-- Safety: Uses SECURITY DEFINER to bypass RLS restrictions
-- Usage: One-time execution to set correct passwords
-- ============================================================================

-- Create a function to reset a user's password
-- This runs with elevated privileges (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.reset_user_password(
  user_email TEXT,
  new_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RETURN 'ERROR: User not found: ' || user_email;
  END IF;

  -- Update the password using pgcrypto's crypt function
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = user_id;

  RETURN 'SUCCESS: Password updated for ' || user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_user_password(TEXT, TEXT) TO authenticated, service_role, postgres;

-- ============================================================================
-- Reset passwords for all 6 LEIRS admin accounts
-- ============================================================================

-- Reset sysadmin password
SELECT public.reset_user_password('sysadmin@leirs.com', 'sysadmin123');

-- Reset incident admin password
SELECT public.reset_user_password('incident@leirs.com', 'incident123');

-- Reset case admin password
SELECT public.reset_user_password('caseadmin@leirs.com', 'case123');

-- Reset dispatch admin password
SELECT public.reset_user_password('dispatch@leirs.com', 'dispatch123');

-- Reset evidence admin password
SELECT public.reset_user_password('evidence@leirs.com', 'evidence123');

-- Reset status admin password
SELECT public.reset_user_password('status@leirs.com', 'status123');

-- ============================================================================
-- Verification: Check all users updated
-- ============================================================================

SELECT 
  email,
  updated_at,
  CASE 
    WHEN updated_at > NOW() - INTERVAL '1 minute' THEN '✓ Just updated'
    ELSE '⚠ Not recently updated'
  END as status
FROM auth.users
WHERE email IN (
  'sysadmin@leirs.com',
  'incident@leirs.com',
  'caseadmin@leirs.com',
  'dispatch@leirs.com',
  'evidence@leirs.com',
  'status@leirs.com'
)
ORDER BY email;

-- ============================================================================
-- Cleanup: Drop the function after use (optional)
-- ============================================================================
-- Uncomment this line after passwords are reset if you want to remove the function:
-- DROP FUNCTION IF EXISTS public.reset_user_password(TEXT, TEXT);

-- ============================================================================
-- DONE
-- ============================================================================
