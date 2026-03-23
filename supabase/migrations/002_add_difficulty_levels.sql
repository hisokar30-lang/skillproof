-- Update challenges table to support 1-10 difficulty scale
-- Also track user's monthly challenge count for free tier

-- Create enum for difficulty 1-10
DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update challenges table to use numeric difficulty
ALTER TABLE challenges
    ADD COLUMN IF NOT EXISTS difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10);

-- Migrate existing difficulty values
UPDATE challenges SET
    difficulty_level = CASE
        WHEN difficulty = 'beginner' THEN 1
        WHEN difficulty = 'intermediate' THEN 5
        WHEN difficulty = 'advanced' THEN 8
        ELSE 3
    END;

-- Make difficulty_level required
ALTER TABLE challenges ALTER COLUMN difficulty_level SET NOT NULL;

-- Create user_monthly_usage table for tracking free tier limits
CREATE TABLE IF NOT EXISTS user_monthly_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    challenges_attempted INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    UNIQUE(user_id, year, month)
);

-- Enable RLS
ALTER TABLE user_monthly_usage ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own usage" ON user_monthly_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON user_monthly_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON user_monthly_usage FOR UPDATE USING (auth.uid() = user_id);

-- Function to increment usage when submission is made
CREATE OR REPLACE FUNCTION increment_user_usage()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER;
    current_month INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    current_month := EXTRACT(MONTH FROM NOW());

    INSERT INTO user_monthly_usage (user_id, year, month, challenges_attempted)
    VALUES (NEW.user_id, current_year, current_month, 1)
    ON CONFLICT (user_id, year, month)
    DO UPDATE SET challenges_attempted = user_monthly_usage.challenges_attempted + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on submissions
DROP TRIGGER IF EXISTS on_submission_created ON submissions;
CREATE TRIGGER on_submission_created
    AFTER INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION increment_user_usage();

-- Create learning_resources table
CREATE TABLE IF NOT EXISTS learning_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    tags TEXT[] DEFAULT '{}',
    related_challenge_ids uuid[] DEFAULT '{}',
    estimated_read_time INTEGER, -- in minutes
    is_published BOOLEAN DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_resources_category ON learning_resources(category);
CREATE INDEX IF NOT EXISTS idx_learning_resources_difficulty ON learning_resources(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_resources_published ON learning_resources(is_published);

-- RLS
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learning resources are viewable by everyone" ON learning_resources FOR SELECT USING (is_published = true);

-- Insert sample learning resources
INSERT INTO learning_resources (title, slug, description, content, category, difficulty_level, tags, estimated_read_time) VALUES
(
    'Getting Started with Python',
    'python-basics',
    'Learn the fundamentals of Python programming language.',
    E'# Getting Started with Python\n\n## What you will learn\n- Variables and data types\n- Basic operators\n- Input/Output\n- Control flow\n\n## Variables\n```python\nname = "Alice"\nage = 25\nheight = 5.6\nis_student = True\n```\n\n## Input/Output\n```python\n# Reading input\nname = input("Enter your name: ")\n\n# Reading numbers\nage = int(input("Enter your age: "))\nheight = float(input("Enter your height: "))\n\n# Printing output\nprint("Hello,", name)\nprint(f"You are {age} years old")\n```\n\n## Challenge Practice\nTry the "Sum of Two Numbers" challenge after reading this!',
    'Python',
    1,
    ARRAY['python', 'basics', 'beginner'],
    5
),
(
    'Reading Multiple Inputs',
    'python-input-handling',
    'Learn how to handle multiple inputs in Python for coding challenges.',
    E'# Reading Multiple Inputs in Python\n\n## Reading Two Numbers\n```python\n# Method 1: Separate lines\na = int(input())\nb = int(input())\n\n# Method 2: Space separated on one line\na, b = map(int, input().split())\n\n# Method 3: List of numbers\nnumbers = list(map(int, input().split()))\n```\n\n## Reading Arrays\n```python\n# Read n, then n numbers\nn = int(input())\narr = list(map(int, input().split()))\n\n# Read line by line\nn = int(input())\narr = [int(input()) for _ in range(n)]\n```\n\n## String Input\n```python\n# Single word\nword = input().strip()\n\n# Multiple words\nwords = input().split()\n\n# Entire line (with spaces)\nline = input().strip()\n```',
    'Python',
    2,
    ARRAY['python', 'input', 'basics'],
    8
),
(
    'String Manipulation in Python',
    'python-strings',
    'Master string operations for coding challenges.',
    E'# String Manipulation in Python\n\n## Basic Operations\n```python\ns = "Hello World"\n\n# Length\nlen(s)  # 11\n\n# Indexing\ns[0]    # ''H''\ns[-1]   # ''d''\n\n# Slicing\ns[0:5]  # ''Hello''\ns[6:]   # ''World''\n```\n\n## String Methods\n```python\n# Case conversion\ns.lower()      # "hello world"\ns.upper()      # "HELLO WORLD"\ns.title()      # "Hello World"\n\n# Strip whitespace\ns.strip()\ns.lstrip()\ns.rstrip()\n\n# Replace\ns.replace("World", "Python")  # "Hello Python"\n\n# Split and Join\nwords = s.split()           # ["Hello", "World"]\n"-".join(words)              # "Hello-World"\n```\n\n## Reversing Strings\n```python\n# Method 1: Slicing (recommended)\ns[::-1]  # "dlroW olleH"\n
# Method 2: reversed()\n".join(reversed(s))\n```\n\n## Checking Properties\n```python\n# Palindrome check\ns == s[::-1]\n\n# Contains substring\n"ell" in s  # True\n```',
    'Python',
    3,
    ARRAY['python', 'strings', 'algorithms'],
    10
),
(
    'Loops and Control Flow',
    'python-loops',
    'Master for loops, while loops, and conditional statements.',
    E'# Loops and Control Flow\n\n## For Loops\n```python\n# Iterate over range\nfor i in range(5):      # 0, 1, 2, 3, 4\n    print(i)\n\n# Iterate with start and stop\nfor i in range(1, 6):   # 1, 2, 3, 4, 5\n    print(i)\n\n# Iterate over list\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(fruit)\n```\n\n## While Loops\n```python\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n```\n\n## FizzBuzz Pattern\n```python\nfor i in range(1, n + 1):\n    if i % 3 == 0 and i % 5 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)\n```',
    'Algorithms',
    4,
    ARRAY['python', 'loops', 'control-flow'],
    12
),
(
    'List Comprehensions',
    'python-list-comprehensions',
    'Write concise and efficient Python code with list comprehensions.',
    E'# Python List Comprehensions\n\n## Basic Syntax\n```python\n# Traditional loop\nsquares = []\nfor x in range(10):\n    squares.append(x**2)\n\n# List comprehension\nsquares = [x**2 for x in range(10)]\n```\n\n## With Conditions\n```python\n# Even numbers only\nevens = [x for x in range(20) if x % 2 == 0]\n\n# Square of evens\neven_squares = [x**2 for x in range(20) if x % 2 == 0]\n\n# If-else in comprehension\nlabels = ["even" if x % 2 == 0 else "odd" for x in range(10)]\n```\n\n## Reading Input with Comprehension\n```python\n# Read n numbers\nn = int(input())\nnumbers = [int(input()) for _ in range(n)]\n\n# Read space-separated numbers\nnumbers = [int(x) for x in input().split()]\n```\n\n## Nested Comprehensions\n```python\n# Flatten matrix\nmatrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\nflat = [x for row in matrix for x in row]\n# Result: [1, 2, 3, 4, 5, 6, 7, 8, 9]\n```',
    'Python',
    4,
    ARRAY['python', 'comprehensions', 'intermediate'],
    10
),
(
    'Algorithm Complexity',
    'algorithm-analysis',
    'Understanding Big O notation and analyzing your code.',
    E'# Algorithm Complexity (Big O)\n\n## Common Complexities\n\n### O(1) - Constant Time\n```python\n# Accessing an array element\narr[5]\n\n# Dictionary lookup\ndict[key]\n```\n\n### O(n) - Linear Time\n```python\n# Looping through array once\nfor x in arr:\n    print(x)\n\n# Finding max\nmax_val = max(arr)\n```\n\n### O(n²) - Quadratic Time\n```python\n# Nested loops\nfor i in range(n):\n    for j in range(n):\n        print(i, j)\n\n# Bubble sort\nfor i in range(n):\n    for j in range(i+1, n):\n        if arr[i] > arr[j]:\n            arr[i], arr[j] = arr[j], arr[i]\n```\n\n### O(log n) - Logarithmic\n```python
# Binary search\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n```\n\n## Tips for Challenges\n- n ≤ 10: O(n!) might work\n- n ≤ 20: O(2ⁿ) might work\n- n ≤ 1000: O(n²) usually works\n- n ≤ 10⁶: O(n log n) or better needed\n- n > 10⁶: O(n) or O(log n) required',
    'Algorithms',
    6,
    ARRAY['algorithms', 'big-o', 'complexity'],
    15
)
ON CONFLICT (slug) DO NOTHING;

-- Update existing challenges to have proper difficulty levels
UPDATE challenges SET difficulty_level = 1 WHERE difficulty = 'beginner';
UPDATE challenges SET difficulty_level = 5 WHERE difficulty = 'intermediate';
UPDATE challenges SET difficulty_level = 8 WHERE difficulty = 'advanced';
