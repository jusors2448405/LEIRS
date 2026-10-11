/**
 * Migration Script: Enhance Case Parties Table
 * Adds address, notes, and information_status columns to case_parties table
 * 
 * Run this from the leirs-frontend directory:
 * node migrate-case-parties.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration (from your .env)
const SUPABASE_URL = 'https://kyvhyhmqwcxbloiliojw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dmh5aG1xd2N4YmxvaWxpb2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzM4MDUyOSwiZXhwIjoyMDUyOTU2NTI5fQ.HBPbKUPxXQRpqsJbBNYh7nqg1CfXrn9kA3dJiK6w_i8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   LEIRS: Enhance Case Parties Table Migration             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Check current structure
    console.log('📋 Step 1: Checking current case_parties structure...');
    const { data: existingData, error: checkError } = await supabase
      .from('case_parties')
      .select('*')
      .limit(1);
    
    if (existingData && existingData.length > 0) {
      const columns = Object.keys(existingData[0]);
      console.log('   Current columns:', columns.join(', '));
      
      if (columns.includes('address') && columns.includes('notes') && columns.includes('information_status')) {
        console.log('\n✅ All new columns already exist! Migration not needed.\n');
        return;
      }
    }

    console.log('   ⚠️  New columns missing, proceeding with migration...\n');

    // Step 2: Execute migration SQL
    console.log('📋 Step 2: Adding new columns via RPC...');
    
    const migrationSQL = `
      -- Add address column
      ALTER TABLE public.case_parties 
      ADD COLUMN IF NOT EXISTS address TEXT;

      -- Add notes column
      ALTER TABLE public.case_parties 
      ADD COLUMN IF NOT EXISTS notes TEXT;

      -- Add information_status column with default and check constraint
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'case_parties' AND column_name = 'information_status'
        ) THEN
          ALTER TABLE public.case_parties 
          ADD COLUMN information_status VARCHAR(30) DEFAULT 'Pending Verification';
          
          ALTER TABLE public.case_parties
          ADD CONSTRAINT case_parties_information_status_check 
          CHECK (information_status IN ('Complete', 'Pending Verification'));
        END IF;
      END $$;

      -- Add column comments
      COMMENT ON COLUMN public.case_parties.address IS 'Physical address of the party (optional, may not be available immediately for respondents)';
      COMMENT ON COLUMN public.case_parties.notes IS 'Additional notes or documentation about the party';
      COMMENT ON COLUMN public.case_parties.information_status IS 'Status of party information completeness';
    `;

    // Try using RPC if available, otherwise manual
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (rpcError) {
      console.log('   ⚠️  RPC not available, using manual approach...\n');
      
      // Manual approach: Execute each statement
      console.log('   Manual SQL execution required. Please run the following in Supabase SQL Editor:\n');
      console.log('─────────────────────────────────────────────────────────────');
      console.log(migrationSQL);
      console.log('─────────────────────────────────────────────────────────────\n');
      
      console.log('   Steps to execute:');
      console.log('   1. Open: https://supabase.com/dashboard/project/kyvhyhmqwcxbloiliojw/sql');
      console.log('   2. Paste the SQL above');
      console.log('   3. Click "Run"');
      console.log('   4. Restart your dev server\n');
      
      process.exit(0);
    }

    console.log('   ✅ Columns added successfully\n');

    // Step 3: Verify changes
    console.log('📋 Step 3: Verifying changes...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('case_parties')
      .select('id, name, address, notes, information_status')
      .limit(1);

    if (verifyError) {
      console.log('   ⚠️  Schema cache issue detected');
      console.log('   Error:', verifyError.message);
      console.log('\n   Action required:');
      console.log('   1. Refresh Supabase schema cache');
      console.log('   2. Restart your development server');
      console.log('   3. Clear browser cache if needed\n');
    } else {
      console.log('   ✅ Verification successful!\n');
      
      if (verifyData && verifyData.length > 0) {
        console.log('   Sample record with new fields:');
        console.log('  ', JSON.stringify(verifyData[0], null, 2));
      }
    }

    // Step 4: Count existing records
    const { count, error: countError } = await supabase
      .from('case_parties')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n📊 Total case_parties records preserved: ${count || 0}`);
    }

    console.log('\n✨ Migration completed!\n');
    console.log('Next steps:');
    console.log('1. Restart your dev server to refresh the schema cache');
    console.log('2. Test adding a new party with address and notes');
    console.log('3. Verify existing parties still display correctly\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
