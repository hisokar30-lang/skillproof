-- Add external book references to learning resources
-- This adds recommended free books to each lesson

-- Add book_references column if not exists
ALTER TABLE learning_resources
ADD COLUMN IF NOT EXISTS external_references JSONB DEFAULT '[]'::jsonb;

-- Update lessons with book references
UPDATE learning_resources
SET external_references = '[
  {"title": "Python for Everybody", "author": "Charles R. Severance", "url": "https://www.py4e.com/book", "type": "book"},
  {"title": "Automate the Boring Stuff with Python", "author": "Al Sweigart", "url": "https://automatetheboringstuff.com/", "type": "book"},
  {"title": "Think Python", "author": "Allen B. Downey", "url": "https://greenteapress.com/thinkpython2/html/thinkpython2001.html", "type": "book"}
]'::jsonb
WHERE slug = 'python-basics';

UPDATE learning_resources
SET external_references = '[
  {"title": "Python Practice Book", "author": "Anand Chitipothu", "url": "https://anandology.com/python-practice-book/index.html", "type": "book"},
  {"title": "Dive Into Python 3", "author": "Mark Pilgrim", "url": "https://diveintopython3.problemsolving.io/", "type": "book"}
]'::jsonb
WHERE slug = 'python-input-handling';

UPDATE learning_resources
SET external_references = '[
  {"title": "Text Processing in Python", "author": "David Mertz", "url": "http://gnosis.cx/TPiP/", "type": "book"},
  {"title": "Python String Methods", "url": "https://docs.python.org/3/library/stdtypes.html#string-methods", "type": "docs"}
]'::jsonb
WHERE slug = 'python-strings';

UPDATE learning_resources
SET external_references = '[
  {"title": "A Byte of Python", "author": "Swaroop C.H.", "url": "https://python.swaroopch.com/", "type": "book"},
  {"title": "Flow Control in Python", "url": "https://automatetheboringstuff.com/2e/chapter2/", "type": "tutorial"}
]'::jsonb
WHERE slug = 'python-loops';

UPDATE learning_resources
SET external_references = '[
  {"title": "Comprehensive Python Guide", "author": "Kenneth Reitz", "url": "https://docs.python-guide.org/", "type": "book"},
  {"title": "Python List Comprehensions", "url": "https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions", "type": "docs"}
]'::jsonb
WHERE slug = 'python-list-comprehensions';

UPDATE learning_resources
SET external_references = '[
  {"title": "Algorithms", "author": "Jeff Erickson", "url": "https://jeffe.cs.illinois.edu/teaching/algorithms/book/Algorithms-JeffE.pdf", "type": "book"},
  {"title": "Problem Solving with Algorithms and Data Structures using Python", "author": "Brad Miller & David Ranum", "url": "https://runestone.academy/ns/books/published/pythonds/index.html", "type": "book"},
  {"title": "A Common-Sense Guide to Data Structures & Algorithms", "author": "Jay Wengrow", "url": "https://github.com/GauravWalia19/Free-Algorithms-Books", "type": "book"}
]'::jsonb
WHERE slug = 'algorithm-analysis';

-- Add new lessons with book references

-- Level 5: Functions
INSERT INTO learning_resources (
  title,
  slug,
  description,
  content,
  category,
  difficulty_level,
  tags,
  estimated_read_time,
  external_references
) VALUES (
  'Functions in Python',
  'python-functions',
  'Learn how to write reusable code with functions.',
  '# Functions in Python

## Defining Functions
```python
def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}!"

# Calling a function
message = greet("Alice")
print(message)  # Hello, Alice!
```

## Parameters and Arguments
```python
# Default parameters
def power(base, exponent=2):
    return base ** exponent

print(power(3))      # 9 (3²)
print(power(2, 3))   # 8 (2³)
```

## Lambda Functions
```python
# Anonymous functions
square = lambda x: x ** 2
print(square(5))  # 25

# Using with map
numbers = [1, 2, 3, 4]
squares = list(map(lambda x: x**2, numbers))
```

## Scope
```python
x = 10  # Global scope

def my_func():
    y = 5  # Local scope
    return x + y  # Can access global
```',
  'Python',
  5,
  ARRAY['python', 'functions', 'intermediate'],
  12,
  '[
    {"title": "How to Think Like a Computer Scientist: Learning with Python", "author": "Jeffrey Elkner", "url": "https://openbookproject.net/thinkcs/python/english3e/", "type": "book"},
    {"title": "Python Functions", "url": "https://docs.python.org/3/tutorial/controlflow.html#defining-functions", "type": "docs"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Level 6: Recursion
INSERT INTO learning_resources (
  title,
  slug,
  description,
  content,
  category,
  difficulty_level,
  tags,
  estimated_read_time,
  external_references
) VALUES (
  'Recursion',
  'recursion',
  'Master recursive thinking and solve problems elegantly.',
  '# Recursion

## What is Recursion?
A function that calls itself.

## Factorial Example
```python
def factorial(n):
    # Base case
    if n <= 1:
        return 1
    # Recursive case
    return n * factorial(n - 1)

print(factorial(5))  # 120
```

## Fibonacci Example
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

## Key Concepts
1. **Base Case**: Stopping condition
2. **Recursive Case**: Function calls itself
3. **Progress**: Must move toward base case

## When to Use Recursion
- Tree traversals
- Divide and conquer
- Backtracking
- Mathematical sequences',
  'Algorithms',
  6,
  ARRAY['algorithms', 'recursion', 'intermediate'],
  15,
  '[
    {"title": "Think Complexity", "author": "Allen B. Downey", "url": "https://greenteapress.com/thinkcomplexity/thinkcomplexity.pdf", "type": "book"},
    {"title": "The Little Book of Recursion", "url": "https://www.freecodecamp.org/news/how-to-use-recursion-in-python/", "type": "tutorial"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Level 7: Sorting Algorithms
INSERT INTO learning_resources (
  title,
  slug,
  description,
  content,
  category,
  difficulty_level,
  tags,
  estimated_read_time,
  external_references
) VALUES (
  'Sorting Algorithms',
  'sorting-algorithms',
  'Learn classic sorting algorithms and their complexities.',
  '# Sorting Algorithms

## Bubble Sort - O(n²)
```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```

## Quick Sort - O(n log n)
```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr

    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quick_sort(left) + middle + quick_sort(right)
```

## Merge Sort - O(n log n)
```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left, right):
    result = []
    while left and right:
        if left[0] < right[0]:
            result.append(left.pop(0))
        else:
            result.append(right.pop(0))
    result.extend(left or right)
    return result
```

## Comparison
| Algorithm | Best | Average | Worst |
|-----------|------|---------|-------|
| Bubble | O(n) | O(n²) | O(n²) |
| Quick | O(n log n) | O(n log n) | O(n²) |
| Merge | O(n log n) | O(n log n) | O(n log n) |',
  'Algorithms',
  7,
  ARRAY['algorithms', 'sorting', 'advanced'],
  20,
  '[
    {"title": "Algorithms, 4th Edition", "author": "Robert Sedgewick & Kevin Wayne", "url": "https://algs4.cs.princeton.edu/home/", "type": "book"},
    {"title": "Sequential and parallel sorting algorithms", "author": "Hans Werner Lang", "url": "https://www.inf.hs-flensburg.de/lang/algorithmen/sortieren/algoen.htm", "type": "book"},
    {"title": "Open Data Structures", "author": "Pat Morin", "url": "https://opendatastructures.org/", "type": "book"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Level 8: Graph Algorithms
INSERT INTO learning_resources (
  title,
  slug,
  description,
  content,
  category,
  difficulty_level,
  tags,
  estimated_read_time,
  external_references
) VALUES (
  'Graph Algorithms Basics',
  'graph-algorithms',
  'Introduction to graph data structures and traversal algorithms.',
  '# Graph Algorithms

## Graph Representation
```python
# Adjacency List
graph = {
    ''A'': [''B'', ''C''],
    ''B'': [''A'', ''D''],
    ''C'': [''A''],
    ''D'': [''B'']
}
```

## Breadth-First Search (BFS)
```python
from collections import deque

def bfs(graph, start, goal):
    visited = set()
    queue = deque([[start]])

    while queue:
        path = queue.popleft()
        node = path[-1]

        if node == goal:
            return path

        if node not in visited:
            visited.add(node)
            for neighbor in graph[node]:
                new_path = list(path)
                new_path.append(neighbor)
                queue.append(new_path)
    return None
```

## Depth-First Search (DFS)
```python
def dfs(graph, node, visited=None):
    if visited is None:
        visited = set()

    visited.add(node)
    print(node)

    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
```',
  'Data Structures',
  8,
  ARRAY['algorithms', 'graphs', 'advanced'],
  25,
  '[
    {"title": "Algorithmic Graph Theory", "author": "David Joyner, Minh Van Nguyen, David Phillips", "url": "https://code.google.com/p/graphbook/", "type": "book"},
    {"title": "Algorithm Design", "author": "Jon Kleinberg & Éva Tardos", "url": "https://archive.org/details/AlgorithmDesign1stEditionByJonKleinbergAndEvaTardos2005PDF", "type": "book"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Level 9: Dynamic Programming
INSERT INTO learning_resources (
  title,
  slug,
  description,
  content,
  category,
  difficulty_level,
  tags,
  estimated_read_time,
  external_references
) VALUES (
  'Dynamic Programming',
  'dynamic-programming',
  'Master the art of solving complex problems through optimal substructure.',
  '# Dynamic Programming

## Key Concepts
1. **Optimal Substructure**: Optimal solution contains optimal sub-solutions
2. **Overlapping Subproblems**: Same subproblems recur
3. **Memoization**: Store results to avoid recomputation

## Fibonacci with Memoization
```python
# Top-down (Memoization)
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n-1, memo) + fib_memo(n-2, memo)
    return memo[n]

# Bottom-up (Tabulation)
def fib_tab(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]
```

## Knapsack Problem
```python
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            if weights[i-1] <= w:
                dp[i][w] = max(
                    values[i-1] + dp[i-1][w-weights[i-1]],
                    dp[i-1][w]
                )
            else:
                dp[i][w] = dp[i-1][w]

    return dp[n][capacity]
```',
  'Dynamic Programming',
  9,
  ARRAY['algorithms', 'dynamic-programming', 'expert'],
  30,
  '[
    {"title": "Algorithms for Decision Making", "author": "Mykel J. Kochenderfer et al.", "url": "https://algorithmsbook.com/decisionmaking/", "type": "book"},
    {"title": "Think Complexity (2nd Edition)", "author": "Allen B. Downey", "url": "https://greenteapress.com/wp/think-complexity-2e/", "type": "book"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Level 10: Advanced Topics
INSERT INTO learning_resources (
  title,
  slug,
  description,
  content,
  category,
  difficulty_level,
  tags,
  estimated_read_time,
  external_references
) VALUES (
  'Advanced Algorithm Design',
  'advanced-algorithms',
  'Explore advanced topics: greedy algorithms, network flow, and more.',
  '# Advanced Algorithm Design

## Greedy Algorithms
Make locally optimal choice at each step.

```python
# Activity Selection (Interval Scheduling)
def activity_selection(activities):
    # Sort by finish time
    activities.sort(key=lambda x: x[1])

    selected = [activities[0]]
    last_end = activities[0][1]

    for start, end in activities[1:]:
        if start >= last_end:
            selected.append((start, end))
            last_end = end

    return selected
```

## Network Flow
Max flow problems and min-cut.

## String Algorithms
- KMP (Knuth-Morris-Pratt)
- Trie data structure
- Suffix arrays

## Geometric Algorithms
- Convex hull
- Line intersection
- Closest pair of points

## Approximation Algorithms
When exact solution is too expensive.',
  'Algorithms',
  10,
  ARRAY['algorithms', 'advanced', 'expert'],
  40,
  '[
    {"title": "The Algorithm Design Manual", "author": "Steven S. Skiena", "url": "https://www8.cs.umu.se/kurser/TDBAfl/VT06/algorithms/BOOK/BOOK/HTM", "type": "book"},
    {"title": "Algorithm Design", "author": "Jon Kleinberg & Éva Tardos", "url": "https://archive.org/details/AlgorithmDesign1stEditionByJonKleinbergAndEvaTardos2005PDF", "type": "book"},
    {"title": "The Design of Approximation Algorithms", "author": "David P. Williamson & David B. Shmoys", "url": "https://www.designofapproxalgs.com/book.pdf", "type": "book"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Verify updates
SELECT title, jsonb_array_length(external_references) as book_count
FROM learning_resources
ORDER BY difficulty_level;
