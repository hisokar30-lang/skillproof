-- Sample challenges for testing
INSERT INTO public.challenges (title, description, difficulty, category, points, time_limit_minutes, test_cases, is_active) VALUES
(
  'Sum of Two Numbers',
  'Write a function that takes two numbers and returns their sum.

Example:
Input: 1 2
Output: 3

The function should read input from stdin and print the result.',
  'beginner',
  'Algorithms',
  10,
  5,
  '[
    {"input": "1 2", "expected_output": "3", "hidden": false},
    {"input": "5 7", "expected_output": "12", "hidden": false},
    {"input": "-1 1", "expected_output": "0", "hidden": true}
  ]'::jsonb,
  true
),
(
  'Reverse a String',
  'Write a function that reverses a string.

Example:
Input: hello
Output: olleh

The function should read input from stdin and print the reversed string.',
  'beginner',
  'Algorithms',
  15,
  5,
  '[
    {"input": "hello", "expected_output": "olleh", "hidden": false},
    {"input": "world", "expected_output": "dlrow", "hidden": false},
    {"input": "12345", "expected_output": "54321", "hidden": true}
  ]'::jsonb,
  true
),
(
  'FizzBuzz',
  'Print numbers from 1 to n. For multiples of 3, print "Fizz". For multiples of 5, print "Buzz". For multiples of both, print "FizzBuzz".

Input: A number n
Output: FizzBuzz sequence (one per line)

Example for n=5:
1
2
Fizz
4
Buzz',
  'intermediate',
  'Algorithms',
  25,
  10,
  '[
    {"input": "3", "expected_output": "1\n2\nFizz", "hidden": false},
    {"input": "5", "expected_output": "1\n2\nFizz\n4\nBuzz", "hidden": false},
    {"input": "15", "expected_output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", "hidden": false}
  ]'::jsonb,
  true
),
(
  'Check Palindrome',
  'Check if a given string is a palindrome (reads the same forwards and backwards). Ignore case and non-alphanumeric characters.

Input: A string
Output: true or false

Examples:
"racecar" -> true
"hello" -> false
"A man a plan a canal Panama" -> true',
  'intermediate',
  'Algorithms',
  30,
  10,
  '[
    {"input": "racecar", "expected_output": "true", "hidden": false},
    {"input": "hello", "expected_output": "false", "hidden": false},
    {"input": "madam", "expected_output": "true", "hidden": true},
    {"input": "Step on no pets", "expected_output": "true", "hidden": true}
  ]'::jsonb,
  true
),
(
  'Find Maximum Subarray',
  'Given an array of integers, find the contiguous subarray with the largest sum and return the sum.

Input: Array of integers (space-separated)
Output: Maximum sum

Example:
Input: -2 1 -3 4 -1 2 1 -5 4
Output: 6 (subarray [4, -1, 2, 1])',
  'advanced',
  'Algorithms',
  50,
  15,
  '[
    {"input": "1 2 3", "expected_output": "6", "hidden": false},
    {"input": "-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6", "hidden": false},
    {"input": "-1 -2 -3", "expected_output": "-1", "hidden": true},
    {"input": "5 4 -1 7 8", "expected_output": "23", "hidden": true}
  ]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;
