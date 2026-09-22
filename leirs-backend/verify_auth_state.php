<?php
/**
 * LEIRS Auth Verification Script - READ ONLY
 * 
 * Purpose: Verify existing auth.users and public.profiles
 * Safety: NO modifications, NO deletions, NO inserts
 * 
 * This script checks:
 * 1. Which of the 6 LEIRS accounts exist in auth.users
 * 2. Which have matching profiles in public.profiles
 * 3. Whether roles match expected values
 * 4. Generates SQL for missing profiles only
 */

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$database = $_ENV['DB_DATABASE'];
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];

echo "=== LEIRS SUPABASE AUTH VERIFICATION (READ ONLY) ===\n";
echo str_repeat("=", 60) . "\n\n";

// Define the 6 required accounts
$required_accounts = [
    ['email' => 'sysadmin@leirs.com', 'role' => 'system_admin', 'name' => 'Carlos Mendoza'],
    ['email' => 'incident@leirs.com', 'role' => 'incident_admin', 'name' => 'Ana Garcia'],
    ['email' => 'caseadmin@leirs.com', 'role' => 'case_admin', 'name' => 'Roberto Cruz'],
    ['email' => 'dispatch@leirs.com', 'role' => 'dispatch_admin', 'name' => 'Elena Torres'],
    ['email' => 'evidence@leirs.com', 'role' => 'evidence_admin', 'name' => 'Miguel Ramos'],
    ['email' => 'status@leirs.com', 'role' => 'status_admin', 'name' => 'Sofia Diaz'],
];

try {
    $conn = pg_connect("host=$host dbname=$database user=$username password=$password sslmode=require");
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    echo "✓ Database connection successful\n\n";
    
    // Step 1: Check each account in auth.users
    echo "STEP 1: Checking auth.users for 6 LEIRS accounts\n";
    echo str_repeat("-", 60) . "\n";
    
    $auth_users = [];
    foreach ($required_accounts as $account) {
        $email = pg_escape_string($conn, $account['email']);
        $query = "SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email = '$email'";
        $result = pg_query($conn, $query);
        
        if ($result && pg_num_rows($result) > 0) {
            $user = pg_fetch_assoc($result);
            $auth_users[$account['email']] = $user;
            $confirmed = $user['email_confirmed_at'] ? '✓ confirmed' : '✗ not confirmed';
            echo sprintf("  ✓ %-30s | UUID: %s | %s\n", 
                $account['email'], 
                substr($user['id'], 0, 8) . '...', 
                $confirmed
            );
        } else {
            echo sprintf("  ✗ %-30s | MISSING from auth.users\n", $account['email']);
        }
    }
    
    echo "\n";
    
    // Step 2: Check profiles table
    echo "STEP 2: Checking public.profiles\n";
    echo str_repeat("-", 60) . "\n";
    
    // Check if profiles table exists
    $query = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')";
    $result = pg_query($conn, $query);
    $profiles_exists = pg_fetch_result($result, 0, 0) === 't';
    
    if (!$profiles_exists) {
        echo "  ✗ profiles table DOES NOT EXIST\n";
        echo "  ⚠️  Need to run: phase1_auth_setup.sql\n\n";
    } else {
        echo "  ✓ profiles table exists\n\n";
        
        // Step 3: Check each account's profile
        echo "STEP 3: Matching auth.users to profiles\n";
        echo str_repeat("-", 60) . "\n";
        
        printf("%-30s | %-12s | %-20s | %-10s\n", "EMAIL", "AUTH UUID", "PROFILE ROLE", "STATUS");
        echo str_repeat("-", 60) . "\n";
        
        $missing_profiles = [];
        
        foreach ($required_accounts as $account) {
            $email = $account['email'];
            
            if (!isset($auth_users[$email])) {
                printf("%-30s | %-12s | %-20s | %-10s\n", 
                    $email, 
                    "N/A", 
                    "N/A", 
                    "❌ NO AUTH"
                );
                continue;
            }
            
            $auth_id = $auth_users[$email]['id'];
            $expected_role = $account['role'];
            
            // Check if profile exists
            $query = "SELECT id, email, role, status FROM public.profiles WHERE id = '$auth_id'";
            $result = pg_query($conn, $query);
            
            if ($result && pg_num_rows($result) > 0) {
                $profile = pg_fetch_assoc($result);
                $role_match = $profile['role'] === $expected_role ? '✓' : '✗';
                $status_icon = $profile['status'] === 'Active' ? '✓' : '✗';
                
                printf("%-30s | %-12s | %-20s | %s %s\n", 
                    $email, 
                    substr($auth_id, 0, 8) . '...', 
                    $profile['role'] . " $role_match", 
                    $profile['status'],
                    $status_icon
                );
            } else {
                printf("%-30s | %-12s | %-20s | %-10s\n", 
                    $email, 
                    substr($auth_id, 0, 8) . '...', 
                    "MISSING", 
                    "❌ NO PROFILE"
                );
                
                // Store for SQL generation
                $missing_profiles[] = [
                    'id' => $auth_id,
                    'email' => $email,
                    'name' => $account['name'],
                    'role' => $expected_role
                ];
            }
        }
        
        echo "\n";
        
        // Step 4: Generate INSERT SQL for missing profiles
        if (count($missing_profiles) > 0) {
            echo "STEP 4: Generated SQL for missing profiles\n";
            echo str_repeat("-", 60) . "\n";
            echo "⚠️  The following profiles are MISSING and need to be created:\n\n";
            
            echo "-- Run this SQL in Supabase SQL Editor\n";
            echo "-- Creates missing profiles using existing auth.users UUIDs\n";
            echo "-- Uses ON CONFLICT DO NOTHING for safety\n\n";
            
            foreach ($missing_profiles as $profile) {
                echo "INSERT INTO public.profiles (id, email, full_name, role, status)\n";
                echo "VALUES (\n";
                echo "  '{$profile['id']}'::UUID,\n";
                echo "  '{$profile['email']}',\n";
                echo "  '{$profile['name']}',\n";
                echo "  '{$profile['role']}',\n";
                echo "  'Active'\n";
                echo ")\n";
                echo "ON CONFLICT (id) DO NOTHING;\n\n";
            }
            
            echo "-- Verify after running:\n";
            echo "SELECT id, email, full_name, role, status FROM public.profiles ORDER BY email;\n\n";
        } else {
            echo "STEP 4: Profile verification\n";
            echo str_repeat("-", 60) . "\n";
            echo "✓ All 6 profiles exist with correct mappings!\n\n";
        }
    }
    
    // Summary
    echo str_repeat("=", 60) . "\n";
    echo "VERIFICATION SUMMARY\n";
    echo str_repeat("=", 60) . "\n";
    echo "Auth users found: " . count($auth_users) . "/6\n";
    if ($profiles_exists) {
        echo "Profiles missing: " . count($missing_profiles) . "\n";
        if (count($missing_profiles) === 0 && count($auth_users) === 6) {
            echo "\n✅ READY: All auth users have matching profiles!\n";
            echo "   Next: Restore Supabase Auth in Login.jsx and App.jsx\n";
        } else {
            echo "\n⚠️  ACTION REQUIRED: Run the generated SQL above\n";
        }
    } else {
        echo "\n⚠️  ACTION REQUIRED: Run phase1_auth_setup.sql first\n";
    }
    echo str_repeat("=", 60) . "\n";
    
    pg_close($conn);
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
