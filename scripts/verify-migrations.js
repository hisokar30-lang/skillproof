require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verify() {
  console.log('🔍 Verifying Database Setup...\n');
  console.log('=' .repeat(60));

  // Check if difficulty_level column exists
  console.log('\n1. Checking challenges table...');
  const { data: challenges, error: chError } = await supabase
    .from('challenges')
    .select('id, title, difficulty, difficulty_level')
    .eq('is_active', true)
    .order('difficulty_level', { ascending: true })
    .limit(5);

  if (chError) {
    console.log('❌ Error:', chError.message);
  } else {
    console.log(`✅ Found ${challenges?.length || 0} active challenges`);
    if (challenges && challenges.length > 0) {
      console.log('\nSample challenges:');
      challenges.forEach(c => {
        console.log(`  - ${c.title} (Level ${c.difficulty_level || 'N/A'})`);
      });
    }
  }

  // Check learning_resources
  console.log('\n2. Checking learning_resources table...');
  const { data: lessons, error: lrError } = await supabase
    .from('learning_resources')
    .select('id, title, difficulty_level')
    .eq('is_published', true);

  if (lrError) {
    console.log('❌ Error:', lrError.message);
    console.log('   Table may not exist yet');
  } else {
    console.log(`✅ Found ${lessons?.length || 0} learning resources`);
    if (lessons && lessons.length > 0) {
      console.log('\nAvailable lessons:');
      lessons.forEach(l => {
        console.log(`  - ${l.title} (Level ${l.difficulty_level})`);
      });
    }
  }

  // Check user_monthly_usage
  console.log('\n3. Checking user_monthly_usage table...');
  const { data: usage, error: umError } = await supabase
    .from('user_monthly_usage')
    .select('*')
    .limit(1);

  if (umError) {
    console.log('❌ Error:', umError.message);
    console.log('   Table may not exist yet');
  } else {
    console.log('✅ user_monthly_usage table exists');
    console.log(`   Current usage records: ${usage?.length || 0}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log('='.repeat(60));

  const allGood = !chError && challenges && challenges.length >= 0; // Could be 0 if new
  const lessonsExist = !lrError;
  const usageExists = !umError;

  if (lessonsExist && usageExists) {
    console.log('✅ All migrations applied successfully!');
    console.log('\nYour database is ready!');
    console.log('Run: npm run dev');
    console.log('Visit: http://localhost:3000/learn');
    console.log('Visit: http://localhost:3000/challenges');
  } else {
    console.log('⚠️  Some tables might be missing');
    console.log('If challenges exist but others don\'t, run ALL_MIGRATIONS.sql again');
  }
}

verify();
