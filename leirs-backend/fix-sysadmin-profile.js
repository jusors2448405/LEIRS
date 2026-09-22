/**
 * Fix sysadmin profile UUID
 * Uses direct PostgreSQL connection to bypass RLS
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

const newUUID = '6b8c4e7e-d3be-405c-bd02-0f552347e704';

async function fixProfile() {
  const client = new Client({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    // Delete old sysadmin profile
    console.log('Deleting old sysadmin profile...');
    const deleteResult = await client.query(
      "DELETE FROM public.profiles WHERE email = 'sysadmin@leirs.com'"
    );
    console.log(`✓ Deleted ${deleteResult.rowCount} row(s)\n`);

    // Insert new sysadmin profile with new UUID
    console.log('Inserting new sysadmin profile...');
    const insertResult = await client.query(
      `INSERT INTO public.profiles (id, email, full_name, role, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [newUUID, 'sysadmin@leirs.com', 'Carlos Mendoza', 'system_admin', 'Active']
    );
    console.log(`✓ Inserted ${insertResult.rowCount} row(s)\n`);

    // Verify
    console.log('Verifying new profile...');
    const verifyResult = await client.query(
      "SELECT id, email, full_name, role, status FROM public.profiles WHERE email = 'sysadmin@leirs.com'"
    );
    
    if (verifyResult.rows.length > 0) {
      console.log('✓ Profile updated successfully!\n');
      console.log('Profile details:');
      console.log(`  UUID: ${verifyResult.rows[0].id}`);
      console.log(`  Email: ${verifyResult.rows[0].email}`);
      console.log(`  Name: ${verifyResult.rows[0].full_name}`);
      console.log(`  Role: ${verifyResult.rows[0].role}`);
      console.log(`  Status: ${verifyResult.rows[0].status}`);
      console.log('\n✅ SUCCESS! Now try logging in with:');
      console.log('   Email: sysadmin@leirs.com');
      console.log('   Password: sysadmin123\n');
    } else {
      console.log('❌ Profile not found after insert');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixProfile();
