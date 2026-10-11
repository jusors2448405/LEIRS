/**
 * Migration Script: Enhance Case Parties Table
 * Adds address, notes, and information_status columns
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = 'https://kyvhyhmqwcxbloiliojw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dmh5aG1xd2N4YmxvaWxpb2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzM4MDUyOSwiZXhwIjoyMDUyOTU2NTI5fQ.HBPbKUPxXQRpqsJbBNYh7nqg1CfXrn9kA3dJiK6w_i8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   LEIRS: Enhance Case Parties Table Migration             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Check current table structure
    console.log('📋 Step 1: Checking current table structure...');
    const { data: currentColumns, error: checkError } = await supabase.rpc('check_columns', {});
    
    // Alternative: Direct SQL query to check columns
    const { data: columnsCheck, error: colError } = await supabase
      .from('case_parties')
      .select('*')
      .limit(1);
    
    if (colError && !colError.message.includes('address')) {
      console.log('✅ Columns already exist, skipping migration');
      return;
    }

    console.log('   Current columns need update\n');

    // Step 2: Add address column
    console.log('📋 Step 2: Adding address column...');
    const { error: addressError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.case_parties ADD COLUMN IF NOT EXISTS address TEXT'
    });

    if (addressError && !addressError.message.includes('already exists')) {
      console.error('   ❌ Failed to add address column:', addressError.message);
    } else {
      console.log('   ✅ Address column added\n');
    }

    // Step 3: Add notes column
    console.log('📋 Step 3: Adding notes column...');
    const { error: notesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.case_parties ADD COLUMN IF NOT EXISTS notes TEXT'
    });

    if (notesError && !notesError.message.includes('already exists')) {
      console.error('   ❌ Failed to add notes column:', notesError.message);
    } else {
      console.log('   ✅ Notes column added\n');
    }

    // Step 4: Add information_status column
    console.log('📋 Step 4: Adding information_status column...');
    const { error: statusError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.case_parties 
            ADD COLUMN IF NOT EXISTS information_status VARCHAR(30) 
            DEFAULT 'Pending Verification' 
            CHECK (information_status IN ('Complete', 'Pending Verification'))`
    });

    if (statusError && !statusError.message.includes('already exists')) {
      console.error('   ❌ Failed to add information_status column:', statusError.message);
    } else {
      console.log('   ✅ Information status column added\n');
    }

    console.log('✨ Migration completed successfully!\n');
    console.log('📊 Verification: Try selecting from case_parties...');

    // Verification
    const { data: testData, error: testError } = await supabase
      .from('case_parties')
      .select('id, name, address, notes, information_status')
      .limit(1);

    if (testError) {
      console.error('   ⚠️  Verification failed:', testError.message);
      console.log('\n   This might be a schema cache issue.');
      console.log('   Please refresh the Supabase schema cache or restart your app.');
    } else {
      console.log('   ✅ Verification successful! New columns are accessible.\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative: Use direct SQL execution
async function runMigrationDirect() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   LEIRS: Enhance Case Parties Table Migration (Direct)    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const migrationSQL = `
-- Add address column
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add notes column
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add information_status column
ALTER TABLE public.case_parties 
ADD COLUMN IF NOT EXISTS information_status VARCHAR(30) 
DEFAULT 'Pending Verification' 
CHECK (information_status IN ('Complete', 'Pending Verification'));

-- Add comments
COMMENT ON COLUMN public.case_parties.address IS 'Physical address of the party (optional, may not be available immediately for respondents)';
COMMENT ON COLUMN public.case_parties.notes IS 'Additional notes or documentation about the party';
COMMENT ON COLUMN public.case_parties.information_status IS 'Status of party information completeness: Complete or Pending Verification (default)';
`;

  console.log('📋 SQL Migration Script:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(migrationSQL);
  console.log('─────────────────────────────────────────────────────────────\n');

  console.log('🔧 To execute this migration:');
  console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/kyvhyhmqwcxbloiliojw');
  console.log('   2. Go to SQL Editor');
  console.log('   3. Paste the SQL above');
  console.log('   4. Click "Run"\n');

  console.log('   OR copy this file path and run in SQL Editor:');
  console.log('   leirs-backend/database/migrations/2026_09_30_enhance_case_parties.sql\n');
}

// Run the direct version (SQL output)
runMigrationDirect();
