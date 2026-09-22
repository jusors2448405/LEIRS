<?php
// Temporary script to check Supabase Auth state
// DO NOT COMMIT - for diagnosis only

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$database = $_ENV['DB_DATABASE'];
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];

$conn = pg_connect("host=$host dbname=$database user=$username password=$password sslmode=require");

if (!$conn) {
    echo "❌ Connection failed\n";
    exit(1);
}

echo "=== SUPABASE AUTH DIAGNOSIS ===\n\n";

// 1. Check if profiles table exists
echo "1. CHECKING PROFILES TABLE\n";
echo str_repeat("-", 50) . "\n";
$result = pg_query($conn, "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles');");
$exists = pg_fetch_result($result, 0, 0);

if ($exists === 't') {
    echo "✓ profiles table EXISTS\n\n";
    
    // Get table structure
    echo "2. PROFILES TABLE COLUMNS\n";
    echo str_repeat("-", 50) . "\n";
    $result = pg_query($conn, "
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles'
        ORDER BY ordinal_position;
    ");
    while ($row = pg_fetch_assoc($result)) {
        echo sprintf("  %-20s | %-15s | nullable=%s\n", $row['column_name'], $row['data_type'], $row['is_nullable']);
    }
    
    // Count profiles
    echo "\n3. PROFILES COUNT\n";
    echo str_repeat("-", 50) . "\n";
    $result = pg_query($conn, "SELECT COUNT(*) as count FROM public.profiles;");
    $count = pg_fetch_result($result, 0, 0);
    echo "Total profiles: $count\n\n";
    
    // List all profiles
    if ($count > 0) {
        echo "4. ALL PROFILES (email, role, status)\n";
        echo str_repeat("-", 50) . "\n";
        $result = pg_query($conn, "SELECT id, email, full_name, role, status FROM public.profiles ORDER BY created_at;");
        while ($row = pg_fetch_assoc($result)) {
            echo sprintf("  %-25s | %-20s | %-8s\n", $row['email'], $row['role'], $row['status']);
        }
    } else {
        echo "⚠️  NO PROFILES FOUND\n";
    }
} else {
    echo "✗ profiles table DOES NOT EXIST\n";
}

// Check auth.users (6 LEIRS accounts)
echo "\n5. AUTH.USERS (Supabase Auth)\n";
echo str_repeat("-", 50) . "\n";
$result = pg_query($conn, "SELECT id, email, created_at, email_confirmed_at FROM auth.users WHERE email LIKE '%@leirs.com' ORDER BY created_at;");
$auth_count = pg_num_rows($result);
echo "Total auth.users with @leirs.com: $auth_count\n\n";

if ($auth_count > 0) {
    echo "Auth users found:\n";
    while ($row = pg_fetch_assoc($result)) {
        $confirmed = $row['email_confirmed_at'] ? '✓ confirmed' : '✗ not confirmed';
        echo sprintf("  %-25s | %s | %s\n", $row['email'], substr($row['id'], 0, 8).'...', $confirmed);
    }
} else {
    echo "⚠️  NO AUTH USERS FOUND\n";
}

// Check RLS policies on profiles
echo "\n6. RLS POLICIES ON PROFILES\n";
echo str_repeat("-", 50) . "\n";
$result = pg_query($conn, "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';");
$policy_count = pg_num_rows($result);
echo "Total policies: $policy_count\n";
if ($policy_count > 0) {
    while ($row = pg_fetch_assoc($result)) {
        echo sprintf("  %s (cmd=%s)\n", $row['policyname'], $row['cmd']);
    }
}

// Check private schema functions
echo "\n7. PRIVATE SCHEMA SECURITY FUNCTIONS\n";
echo str_repeat("-", 50) . "\n";
$result = pg_query($conn, "SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'private');");
$func_count = pg_num_rows($result);
echo "Total functions: $func_count\n";
if ($func_count > 0) {
    while ($row = pg_fetch_assoc($result)) {
        echo "  ✓ private.{$row['proname']}()\n";
    }
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "DIAGNOSIS COMPLETE\n";
echo str_repeat("=", 50) . "\n";

pg_close($conn);
