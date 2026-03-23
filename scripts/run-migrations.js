require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration(filename) {
  console.log(`\n📦 Running migration: ${filename}`);
  console.log('='.repeat(50));

  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', filename),
    'utf8'
  );

  // Split by semicolon to run statements individually
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);

    const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      console.log('Trying alternative approach...');

      // Alternative: Insert into a migrations tracking table
      const { error: insertError } = await supabase
        .from('migrations_log')
        .insert({ name: filename, content: stmt });

      if (insertError) {
        console.log(`⚠️  Statement may have already run or requires manual execution`);
      }
    } else {
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    // Since we can't use exec_sql via RPC, let's create SQL file for manual execution
    console.log('\n⚠️  Automated migration requires admin privileges.');
    console.log('Please run these SQL files manually in Supabase SQL Editor:\n');
    console.log('1. Open: https://app.supabase.com/project/xubouppyqrqdvamzlkin/sql');
    console.log('2. Click "New Query"\n');
    console.log('='.repeat(60));
    console.log('FILES TO RUN (in order):');
    console.log('='.repeat(60));
    console.log('\n📄 MIGRATION 1: 002_add_difficulty_levels.sql');
    console.log('   Location: supabase/migrations/002_add_difficulty_levels.sql');
    console.log('\n📄 MIGRATION 2: 003_add_more_challenges.sql');
    console.log('   Location: supabase/migrations/003_add_more_challenges.sql\n');
    console.log('='.repeat(60));
    console.log('STEPS:');
    console.log('='.repeat(60));
    console.log('1. Copy contents of 002_add_difficulty_levels.sql');
    console.log('2. Paste in Supabase SQL Editor');
    console.log('3. Click Run');
    console.log('4. Wait for success');
    console.log('5. Repeat for 003_add_more_challenges.sql\n');

    // Show file sizes
    const file1 = fs.statSync(path.join(__dirname, '..', 'supabase', 'migrations', '002_add_difficulty_levels.sql'));
    const file2 = fs.statSync(path.join(__dirname, '..', 'supabase', 'migrations', '003_add_more_challenges.sql'));

    console.log('File sizes:');
    console.log(`  - 002_add_difficulty_levels.sql: ${(file1.size / 1024).toFixed(1)} KB`);
    console.log(`  - 003_add_more_challenges.sql: ${(file2.size / 1024).toFixed(1)} KB`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
