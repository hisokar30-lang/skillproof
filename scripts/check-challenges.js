require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log('Checking challenges...\n');

  // Get all challenges
  const { data: allChallenges, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Total challenges in database: ${allChallenges?.length || 0}\n`);

  // Group by title
  const byTitle = {};
  allChallenges?.forEach(c => {
    if (!byTitle[c.title]) byTitle[c.title] = [];
    byTitle[c.title].push(c);
  });

  console.log('Unique challenge titles:');
  Object.keys(byTitle).sort().forEach(title => {
    const count = byTitle[title].length;
    const c = byTitle[title][0];
    console.log(`  ${title} (Level ${c.difficulty_level}) - ${count} occurrence${count > 1 ? 's' : ''}`);
  });

  // Check for specific challenges
  console.log('\n\nChecking for expected challenges:');
  const expected = [
    'Sum of Two Numbers',
    'Reverse a String',
    'FizzBuzz',
    'Check Palindrome',
    'Find Maximum Subarray',
    'Hello World',
    'Print Your Name'
  ];

  for (const title of expected) {
    const found = allChallenges?.some(c => c.title === title);
    console.log(`  ${found ? '✅' : '❌'} ${title}`);
  }

  // Check if ON CONFLICT prevented inserts
  console.log('\n\n⚠️  Note: If challenges show as "missing", they may have been skipped');
  console.log('   due to ON CONFLICT DO NOTHING (duplicates detected).');
}

check();
