/**
 * Direct PostgreSQL Migration Execution
 * Adds columns to case_parties table using direct SQL connection
 */

import pg from 'pg';
const { Client } = pg;

// Database configuration from .env
const client = new Client({
  host: 'db.kyvhyhmqwcxbloiliojw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres.kyvhyhmqwcxbloiliojw',
  password: 'WeakAkoo?1',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   LEIRS: Case Parties Migration - Direct SQL              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check current structure
    console.log('📋 Step 1: Checking current structure...');
    const checkQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'case_parties'
      ORDER BY ordinal_position;
    `;
    const currentCols = await client.query(checkQuery);
    console.log(`   Found ${currentCols.rows.length} columns\n`);

    // Check if columns already exist
    const hasAddress = currentCols.rows.some(col => col.column_name === 'address');
    const hasNotes = currentCols.rows.some(col => col.column_name === 'notes');
    const hasStatus = currentCols.rows.some(col => col.column_name === 'information_status');

    if (hasAddress && hasNotes && hasStatus) {
      console.log('✅ All columns already exist! No migration needed.\n');
      await client.end();
      return;
    }

    // Run migration
    console.log('📋 Step 2: Adding new columns...\n');

    if (!hasAddress) {
      console.log('   Adding address column...');
      await client.query('ALTER TABLE public.case_parties ADD COLUMN address TEXT;');
      await client.query(`COMMENT ON COLUMN public.case_parties.address IS 'Physical address of the party (optional)';`);
      console.log('   ✅ address added');
    }

    if (!hasNotes) {
      console.log('   Adding notes column...');
      await client.query('ALTER TABLE public.case_parties ADD COLUMN notes TEXT;');
      await client.query(`COMMENT ON COLUMN public.case_parties.notes IS 'Additional notes or documentation about the party';`);
      console.log('   ✅ notes added');
    }

    if (!hasStatus) {
      console.log('   Adding information_status column...');
      await client.query(`
        ALTER TABLE public.case_parties 
        ADD COLUMN information_status VARCHAR(30) DEFAULT 'Pending Verification';
      `);
      await client.query(`
        ALTER TABLE public.case_parties
        ADD CONSTRAINT case_parties_information_status_check 
        CHECK (information_status IN ('Complete', 'Pending Verification'));
      `);
      await client.query(`COMMENT ON COLUMN public.case_parties.information_status IS 'Status of party information completeness';`);
      console.log('   ✅ information_status added');
    }

    console.log('\n📋 Step 3: Verifying changes...');
    const verifyQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'case_parties'
        AND column_name IN ('address', 'notes', 'information_status')
      ORDER BY column_name;
    `;
    const newCols = await client.query(verifyQuery);
    console.log(`   ✅ Found ${newCols.rows.length}/3 new columns:\n`);
    newCols.rows.forEach(col => {
      console.log(`      - ${col.column_name} (${col.data_type})${col.column_default ? ' DEFAULT ' + col.column_default : ''}`);
    });

    // Count existing records
    console.log('\n📋 Step 4: Checking existing data...');
    const countQuery = 'SELECT COUNT(*) FROM public.case_parties;';
    const countResult = await client.query(countQuery);
    console.log(`   ✅ ${countResult.rows[0].count} existing records preserved\n`);

    console.log('✨ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Restart your dev server (Ctrl+C then npm run dev)');
    console.log('2. Test the Case Parties module');
    console.log('3. Try adding a party with address and notes\n');

    await client.end();
    console.log('✅ Database connection closed.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    await client.end();
    process.exit(1);
  }
}

runMigration();
