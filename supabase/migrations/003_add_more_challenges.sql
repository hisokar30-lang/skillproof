-- Additional challenges covering levels 1-10
-- Also updating existing challenges to have difficulty_level

INSERT INTO public.challenges (
  title, description, difficulty, difficulty_level, category, points, time_limit_minutes, test_cases, is_active
) VALUES
-- Level 1: Very Easy
(
  'Hello World',
  'Write a program that prints "Hello, World!" to the console.\n\nThis is the traditional first program.\n\nInput: None\nOutput: Hello, World!',
  'beginner',
  1,
  'Fundamentals',
  5,
  2,
  '[
    {"input": "", "expected_output": "Hello, World!", "hidden": false}
  ]'::jsonb,
  true
),
(
  'Print Your Name',
  'Write a program that reads a name from input and prints "Hello, [name]!"\n\nExample:\nInput: Alice\nOutput: Hello, Alice!',
  'beginner',
  1,
  'Fundamentals',
  5,
  2,
  '[
    {"input": "Alice", "expected_output": "Hello, Alice!", "hidden": false},
    {"input": "Bob", "expected_output": "Hello, Bob!", "hidden": false},
    {"input": "World", "expected_output": "Hello, World!", "hidden": true}
  ]'::jsonb,
  true
),

-- Level 2: Easy
(
  'Calculate Area of Rectangle',
  'Calculate the area of a rectangle given its width and height.\n\nInput: Two integers (width height)\nOutput: Area (width * height)',
  'beginner',
  2,
  'Math',
  8,
  3,
  '[
    {"input": "5 3", "expected_output": "15", "hidden": false},
    {"input": "10 10", "expected_output": "100", "hidden": false},
    {"input": "7 8", "expected_output": "56", "hidden": true}
  ]'::jsonb,
  true
),
(
  'Temperature Converter',
  'Convert Celsius to Fahrenheit.\n\nFormula: F = C * 9/5 + 32\n\nInput: Temperature in Celsius (integer)\nOutput: Temperature in Fahrenheit (rounded to nearest integer)',
  'beginner',
  2,
  'Math',
  8,
  3,
  '[
    {"input": "0", "expected_output": "32", "hidden": false},
    {"input": "100", "expected_output": "212", "hidden": false},
    {"input": "37", "expected_output": "99", "hidden": true}
  ]'::jsonb,
  true
),

-- Level 3: Easy-Medium
(
  'Find Maximum of Three',
  'Find the maximum of three numbers.\n\nInput: Three integers separated by spaces\nOutput: The largest number',
  'beginner',
  3,
  'Algorithms',
  10,
  4,
  '[
    {"input": "1 2 3", "expected_output": "3", "hidden": false},
    {"input": "5 5 2", "expected_output": "5", "hidden": false},
    {"input": "-1 -5 -3", "expected_output": "-1", "hidden": true}
  ]'::jsonb,
  true
),
(
  'Count Vowels',
  'Count the number of vowels (a, e, i, o, u) in a string.\n\nInput: A string\nOutput: Number of vowels (case-insensitive)',
  'beginner',
  3,
  'Strings',
  10,
  4,
  '[
    {"input": "Hello", "expected_output": "2", "hidden": false},
    {"input": "AEIOU", "expected_output": "5", "hidden": false},
    {"input": "Rhythm", "expected_output": "0", "hidden": true}
  ]'::jsonb,
  true
),

-- Level 4: Medium
(
  'Factorial Calculation',
  'Calculate the factorial of a number n (n!).\n\nInput: Integer n\nOutput: n! (factorial)\n\nExample: 5! = 5 × 4 × 3 × 2 × 1 = 120',
  'intermediate',
  4,
  'Math',
  15,
  5,
  '[
    {"input": "5", "expected_output": "120", "hidden": false},
    {"input": "0", "expected_output": "1", "hidden": false},
    {"input": "10", "expected_output": "3628800", "hidden": true}
  ]'::jsonb,
  true
),
(
  'Check Prime Number',
  'Check if a number is prime.\n\nInput: Integer n\nOutput: true if prime, false otherwise',
  'intermediate',
  4,
  'Math',
  15,
  5,
  '[
    {"input": "7", "expected_output": "true", "hidden": false},
    {"input": "12", "expected_output": "false", "hidden": false},
    {"input": "97", "expected_output": "true", "hidden": true}
  ]'::jsonb,
  true
),

-- Level 5: Medium
(
  'Fibonacci Sequence',
  'Generate the first n Fibonacci numbers.\n\nSequence: 0, 1, 1, 2, 3, 5, 8, 13...\n\nInput: n\nOutput: First n Fibonacci numbers (space-separated)',
  'intermediate',
  5,
  'Math',
  20,
  6,
  '[
    {"input": "5", "expected_output": "0 1 1 2 3", "hidden": false},
    {"input": "8", "expected_output": "0 1 1 2 3 5 8 13", "hidden": false},
    {"input": "1", "expected_output": "0", "hidden": true}
  ]'::jsonb,
  true
),
(
  'Anagram Check',
  'Check if two strings are anagrams (contain same characters).\n\nInput: Two strings separated by newline\nOutput: true if anagrams, false otherwise',
  'intermediate',
  5,
  'Strings',
  20,
  6,
  '[
    {"input": "listen\nsilent", "expected_output": "true", "hidden": false},
    {"input": "hello\nworld", "expected_output": "false", "hidden": false},
    {"input": "anagram\nnagaram", "expected_output": "true", "hidden": true}
  ]'::jsonb,
  true
),

-- Level 6: Medium-Hard
(
  'Two Sum Problem',
  'Find two numbers in an array that sum to a target.\n\nInput: First line: target sum\nSecond line: array of integers (space-separated)\nOutput: Indices of two numbers that sum to target (0-based, space-separated)',
  'intermediate',
  6,
  'Algorithms',
  25,
  8,
  '[
    {"input": "9\n2 7 11 15", "expected_output": "0 1", "hidden": false},
    {"input": "6\n3 2 4", "expected_output": "1 2", "hidden": false}
  ]'::jsonb,
  true
),
(
  'Valid Parentheses',
  'Check if a string of parentheses is valid.\n\nValid if: Every opening bracket has a corresponding closing bracket in correct order.\n\nInput: String containing ()[]{}\nOutput: true if valid, false otherwise',
  'intermediate',
  6,
  'Data Structures',
  25,
  8,
  '[
    {"input": "()", "expected_output": "true", "hidden": false},
    {"input": "()[]{}", "expected_output": "true", "hidden": false},
    {"input": "([)]", "expected_output": "false", "hidden": true}
  ]'::jsonb,
  true
),

-- Level 7: Hard
(
  'Merge Sorted Arrays',
  'Merge two sorted arrays into one sorted array.\n\nInput: First line: n m (sizes)\nSecond line: first array (n elements)\nThird line: second array (m elements)\nOutput: Merged sorted array',
  'advanced',
  7,
  'Algorithms',
  35,
  10,
  '[
    {"input": "3 3\n1 2 4\n1 3 5", "expected_output": "1 1 2 3 4 5", "hidden": false},
    {"input": "2 3\n1 3\n2 4 6", "expected_output": "1 2 3 4 6", "hidden": false}
  ]'::jsonb,
  true
),
(
  'Binary Tree Level Order',
  'Given a binary tree as an array representation, return level order traversal.\n\nInput: Space-separated values (null for missing nodes)\nOutput: Level order traversal (space-separated)\n\nExample: [3,9,20,null,null,15,7]',
  'advanced',
  7,
  'Data Structures',
  35,
  10,
  '[
    {"input": "3 9 20 null null 15 7", "expected_output": "3 9 20 15 7", "hidden": false}
  ]'::jsonb,
  true
),

-- Level 8: Hard
(
  'Longest Substring Without Repeating Characters',
  'Find the length of the longest substring without repeating characters.\n\nInput: String\nOutput: Length of longest substring',
  'advanced',
  8,
  'Algorithms',
  40,
  12,
  '[
    {"input": "abcabcbb", "expected_output": "3", "hidden": false},
    {"input": "bbbbb", "expected_output": "1", "hidden": false},
    {"input": "pwwkew", "expected_output": "3", "hidden": true}
  ]'::jsonb,
  true
),
(
  'Climbing Stairs',
  'Count ways to climb n stairs, taking 1 or 2 steps at a time.\n\nInput: n (number of stairs)\nOutput: Number of distinct ways\n\nExample: n=3 -> 3 ways: (1,1,1), (1,2), (2,1)',
  'advanced',
  8,
  'Dynamic Programming',
  40,
  12,
  '[
    {"input": "2", "expected_output": "2", "hidden": false},
    {"input": "3", "expected_output": "3", "hidden": false},
    {"input": "10", "expected_output": "89", "hidden": true}
  ]'::jsonb,
  true
),

-- Level 9: Very Hard
(
  'LRU Cache Implementation',
  'Implement an LRU (Least Recently Used) Cache.\n\nOperations:\n- put(key, value): Add key-value pair\n- get(key): Get value or -1 if not found\n\nInput: Series of commands (PUT key value or GET key)\nOutput: Results of GET operations (space-separated, -1 for not found)',
  'advanced',
  9,
  'Data Structures',
  50,
  15,
  '[
    {"input": "PUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2", "expected_output": "1 -1", "hidden": false}
  ]'::jsonb,
  true
),
(
  'Edit Distance',
  'Find minimum number of operations to convert word1 to word2.\n\nOperations: insert, delete, or replace a character.\n\nInput: Two words (space-separated)\nOutput: Minimum edit distance',
  'advanced',
  9,
  'Dynamic Programming',
  50,
  15,
  '[
    {"input": "horse ros", "expected_output": "3", "hidden": false},
    {"input": "intention execution", "expected_output": "5", "hidden": false}
  ]'::jsonb,
  true
),

-- Level 10: Expert
(
  'Regular Expression Matching',
  'Implement regular expression matching with support for . and *.\n\n. Matches any single character.\n* Matches zero or more of the preceding element.\n\nInput: String pattern (space-separated)\nOutput: true if pattern matches string, false otherwise',
  'advanced',
  10,
  'Algorithms',
  60,
  20,
  '[
    {"input": "aa a", "expected_output": "false", "hidden": false},
    {"input": "aa a*", "expected_output": "true", "hidden": false},
    {"input": "ab .*", "expected_output": "true", "hidden": true}
  ]'::jsonb,
  true
),
(
  'Trapping Rain Water',
  'Given n non-negative integers representing elevation map, compute trapped water.\n\nInput: Array of heights (space-separated)\nOutput: Units of water trapped',
  'advanced',
  10,
  'Algorithms',
  60,
  20,
  '[
    {"input": "0 1 0 2 1 0 1 3 2 1 2 1", "expected_output": "6", "hidden": false},
    {"input": "4 2 0 3 2 5", "expected_output": "9", "hidden": false}
  ]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

-- Verify challenges count
SELECT COUNT(*) as total_challenges FROM challenges;
