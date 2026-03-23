require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const challenges = [
  {
    title: 'Sum of Two Numbers',
    description: `Write a function that takes two numbers and returns their sum.

Example:
Input: 1 2
Output: 3

The function should read input from stdin and print the result.`,
    difficulty: 'beginner',
    category: 'Algorithms',
    points: 10,
    time_limit_minutes: 5,
    test_cases: [
      { input: '1 2', expected_output: '3', hidden: false },
      { input: '5 7', expected_output: '12', hidden: false },
      { input: '-1 1', expected_output: '0', hidden: true }
    ],
    is_active: true
  },
  {
    title: 'Reverse a String',
    description: `Write a function that reverses a string.

Example:
Input: hello
Output: olleh

The function should read input from stdin and print the reversed string.`,
    difficulty: 'beginner',
    category: 'Algorithms',
    points: 15,
    time_limit_minutes: 5,
    test_cases: [
      { input: 'hello', expected_output: 'olleh', hidden: false },
      { input: 'world', expected_output: 'dlrow', hidden: false },
      { input: '12345', expected_output: '54321', hidden: true }
    ],
    is_active: true
  },
  {
    title: 'FizzBuzz',
    description: `Print numbers from 1 to n. For multiples of 3, print "Fizz". For multiples of 5, print "Buzz". For multiples of both, print "FizzBuzz".

Input: A number n
Output: FizzBuzz sequence (one per line)

Example for n=5:
1
2
Fizz
4
Buzz`,
    difficulty: 'intermediate',
    category: 'Algorithms',
    points: 25,
    time_limit_minutes: 10,
    test_cases: [
      { input: '3', expected_output: '1\n2\nFizz', hidden: false },
      { input: '5', expected_output: '1\n2\nFizz\n4\nBuzz', hidden: false },
      { input: '15', expected_output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', hidden: false }
    ],
    is_active: true
  },
  {
    title: 'Check Palindrome',
    description: `Check if a given string is a palindrome (reads the same forwards and backwards). Ignore case and non-alphanumeric characters.

Input: A string
Output: true or false

Examples:
"racecar" -> true
"hello" -> false
"A man a plan a canal Panama" -> true`,
    difficulty: 'intermediate',
    category: 'Algorithms',
    points: 30,
    time_limit_minutes: 10,
    test_cases: [
      { input: 'racecar', expected_output: 'true', hidden: false },
      { input: 'hello', expected_output: 'false', hidden: false },
      { input: 'madam', expected_output: 'true', hidden: true },
      { input: 'Step on no pets', expected_output: 'true', hidden: true }
    ],
    is_active: true
  },
  {
    title: 'Find Maximum Subarray',
    description: `Given an array of integers, find the contiguous subarray with the largest sum and return the sum.

Input: Array of integers (space-separated)
Output: Maximum sum

Example:
Input: -2 1 -3 4 -1 2 1 -5 4
Output: 6 (subarray [4, -1, 2, 1])`,
    difficulty: 'advanced',
    category: 'Algorithms',
    points: 50,
    time_limit_minutes: 15,
    test_cases: [
      { input: '1 2 3', expected_output: '6', hidden: false },
      { input: '-2 1 -3 4 -1 2 1 -5 4', expected_output: '6', hidden: false },
      { input: '-1 -2 -3', expected_output: '-1', hidden: true },
      { input: '5 4 -1 7 8', expected_output: '23', hidden: true }
    ],
    is_active: true
  }
];

async function seed() {
  console.log('Seeding challenges...');

  // Check if challenges already exist
  const { data: existing } = await supabase.from('challenges').select('id');
  if (existing && existing.length > 0) {
    console.log(`Found ${existing.length} existing challenges. Skipping seed.`);
    return;
  }

  const { data, error } = await supabase.from('challenges').insert(challenges).select();

  if (error) {
    console.error('Error seeding challenges:', error);
    process.exit(1);
  }

  console.log(`✅ Seeded ${data?.length || 0} challenges successfully!`);
  console.log('\nCreated challenges:');
  data?.forEach(c => console.log(`  - ${c.title} (${c.difficulty})`));
}

seed();
