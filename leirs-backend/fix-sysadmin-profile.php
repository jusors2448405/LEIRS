<?php
/**
 * Fix sysadmin profile UUID
 * Uses direct PostgreSQL connection to bypass RLS
 */

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$newUUID = '6b8c4e7e-d3be-405c-bd02-0f552347e704';
$email = 'sysadmin@leirs.com';
$fullName = 'Carlos Mendoza';
$role = 'system_admin';
$status = 'Active';

echo "==================================================\n";
echo "Fix Sysadmin Profile UUID\n";
echo "==================================================\n\n";

try {
    // Connect to database
    $conn = pg_connect(sprintf(
        "host=%s dbname=%s user=%s password=%s sslmode=require",
        $_ENV['DB_HOST'],
        $_ENV['DB_DATABASE'],
        $_ENV['DB_USERNAME'],
        $_ENV['DB_PASSWORD']
    ));

    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    echo "✓ Connected to database\n\n";

    // Delete old sysadmin profile
    echo "Deleting old sysadmin profile...\n";
    $deleteQuery = "DELETE FROM public.profiles WHERE email = '$email'";
    $deleteResult = pg_query($conn, $deleteQuery);
    
    if (!$deleteResult) {
        throw new Exception("Delete failed: " . pg_last_error($conn));
    }
    
    $deletedRows = pg_affected_rows($deleteResult);
    echo "✓ Deleted $deletedRows row(s)\n\n";

    // Insert new sysadmin profile with new UUID
    echo "Inserting new sysadmin profile...\n";
    $insertQuery = sprintf(
        "INSERT INTO public.profiles (id, email, full_name, role, status) VALUES ('%s', '%s', '%s', '%s', '%s')",
        $newUUID,
        $email,
        $fullName,
        $role,
        $status
    );
    $insertResult = pg_query($conn, $insertQuery);
    
    if (!$insertResult) {
        throw new Exception("Insert failed: " . pg_last_error($conn));
    }
    
    $insertedRows = pg_affected_rows($insertResult);
    echo "✓ Inserted $insertedRows row(s)\n\n";

    // Verify
    echo "Verifying new profile...\n";
    $verifyQuery = "SELECT id, email, full_name, role, status FROM public.profiles WHERE email = '$email'";
    $verifyResult = pg_query($conn, $verifyQuery);
    
    if (!$verifyResult || pg_num_rows($verifyResult) === 0) {
        throw new Exception("Profile not found after insert");
    }

    $profile = pg_fetch_assoc($verifyResult);
    
    echo "✓ Profile updated successfully!\n\n";
    echo "Profile details:\n";
    echo "  UUID: {$profile['id']}\n";
    echo "  Email: {$profile['email']}\n";
    echo "  Name: {$profile['full_name']}\n";
    echo "  Role: {$profile['role']}\n";
    echo "  Status: {$profile['status']}\n\n";
    
    echo "==================================================\n";
    echo "✅ SUCCESS!\n";
    echo "==================================================\n\n";
    echo "Now try logging in with:\n";
    echo "  Email: sysadmin@leirs.com\n";
    echo "  Password: sysadmin123\n\n";

    pg_close($conn);

} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
