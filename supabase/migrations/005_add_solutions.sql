-- Add solutions table for storing optimal solutions and explanations

CREATE TABLE IF NOT EXISTS solutions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('python', 'javascript', 'typescript')),
    code TEXT NOT NULL,
    explanation TEXT NOT NULL,
    time_complexity TEXT NOT NULL,
    space_complexity TEXT NOT NULL,
    hints TEXT[] DEFAULT '{}',
    is_optimal BOOLEAN DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(challenge_id, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_solutions_challenge ON solutions(challenge_id);

-- RLS
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solutions are viewable by everyone" ON solutions FOR SELECT USING (true);

-- Insert sample solutions for existing challenges
INSERT INTO solutions (challenge_id, language, code, explanation, time_complexity, space_complexity)
SELECT
    c.id,
    'python',
    '# Optimal Solution
def solve():
    a, b = map(int, input().split())
    print(a + b)

solve()',
    'This is the optimal solution because we directly read two integers from input, add them, and print the result. No extra operations needed.',
    'O(1)',
    'O(1)'
FROM challenges c
WHERE c.title = 'Sum of Two Numbers'
ON CONFLICT DO NOTHING;

INSERT INTO solutions (challenge_id, language, code, explanation, time_complexity, space_complexity)
SELECT
    c.id,
    'python',
    '# Optimal Solution
def solve():
    s = input().strip()
    print(s[::-1])

solve()',
    'Python string slicing [::-1] is the most efficient way to reverse a string. It creates a reversed copy in O(n) time.',
    'O(n)',
    'O(n)'
FROM challenges c
WHERE c.title = 'Reverse a String'
ON CONFLICT DO NOTHING;

INSERT INTO solutions (challenge_id, language, code, explanation, time_complexity, space_complexity, hints)
SELECT
    c.id,
    'python',
    '# Optimal Solution
def solve():
    n = int(input())
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

solve()',
    'The key is checking 15 first (LCM of 3 and 5) before checking 3 or 5 individually. We loop once from 1 to n, printing the appropriate value.',
    'O(n)',
    'O(1)',
    ARRAY['Check divisibility by 15 before 3 or 5', 'Use modulo operator %', 'Loop from 1 to n inclusive']
FROM challenges c
WHERE c.title = 'FizzBuzz'
ON CONFLICT DO NOTHING;

INSERT INTO solutions (challenge_id, language, code, explanation, time_complexity, space_complexity)
SELECT
    c.id,
    'python',
    '# Optimal Solution
def solve():
    s = input().strip()
    # Compare with reverse
    if s == s[::-1]:
        print("true")
    else:
        print("false")

solve()',
    'String slicing [::-1] creates a reversed copy. Comparing to original is the most straightforward approach for this problem.',
    'O(n)',
    'O(n)'
FROM challenges c
WHERE c.title = 'Check Palindrome'
ON CONFLICT DO NOTHING;

-- Add solutions for other challenges
INSERT INTO solutions (challenge_id, language, code, explanation, time_complexity, space_complexity, hints)
SELECT
    c.id,
    'python',
    '# Optimal Solution (Kadane''s Algorithm)
def solve():
    arr = list(map(int, input().split()))
    max_so_far = arr[0]
    curr_max = arr[0]

    for i in range(1, len(arr)):
        curr_max = max(arr[i], curr_max + arr[i])
        max_so_far = max(max_so_far, curr_max)

    print(max_so_far)

solve()',
    'Kadane''s Algorithm tracks the maximum subarray ending at each position. At each element, we decide: start new subarray or extend existing? This gives O(n) time instead of O(n³) brute force.',
    'O(n)',
    'O(1)',
    ARRAY['Track current sum and maximum sum separately', 'At each element: max(arr[i], curr_sum + arr[i])', 'Kadane''s Algorithm']
FROM challenges c
WHERE c.title = 'Find Maximum Subarray'
ON CONFLICT DO NOTHING;

INSERT INTO solutions (challenge_id, language, code, explanation, time_complexity, space_complexity)
SELECT
    c.id,
    'python',
    'print("Hello, World!")',
    'The simplest Python program. print() outputs to stdout.',
    'O(1)',
    'O(1)'
FROM challenges c
WHERE c.title = 'Hello World'
ON CONFLICT DO NOTHING;

INSERT INTO solutions (challenge_id, language, code, explanation, time_complexity, space_complexity)
SELECT
    c.id,
    'python',
    'name = input()
print(f"Hello, {name}!")',
    'Use input() to read from stdin, then f-string for formatted output.',
    'O(1)',
    'O(1)'
FROM challenges c
WHERE c.title = 'Print Your Name'
ON CONFLICT DO NOTHING;

-- Verify
SELECT c.title, COUNT(s.id) as solution_count
FROM challenges c
LEFT JOIN solutions s ON c.id = s.challenge_id
GROUP BY c.id, c.title
ORDER BY solution_count DESC;
