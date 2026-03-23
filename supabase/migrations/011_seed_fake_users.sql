-- Add fake users for social proof
-- Run this after all migrations are complete

DO $$
DECLARE
  user_id_val uuid;
  challenge_record RECORD;
  i INTEGER;
  demo_email TEXT;
  demo_name TEXT;
  names TEXT[] := ARRAY['Alex Johnson', 'Maria Silva', 'James Chen', 'Sofia Garcia', 'Oliver Brown', 'Emma Martinez', 'Lucas Kim', 'Isabella Lee'];
  categories TEXT[] := ARRAY['algorithms', 'data structures', 'web development'];
BEGIN
  -- Create 50 fake user accounts
  FOR i IN 1..50 LOOP
    demo_email := 'demo' || i::text || '@skillproof.io';
    demo_name := names[(i % 8) + 1] || ' ' || i::text;

    -- Check if user already exists
    SELECT id INTO user_id_val FROM auth.users WHERE email = demo_email;

    -- Only create if doesn't exist
    IF user_id_val IS NULL THEN
      -- Create auth user
      INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at
      ) VALUES (
        gen_random_uuid(),
        demo_email,
        crypt('Demo123!', gen_salt('bf')),
        now() - (random() * 365 || ' days')::interval,
        jsonb_build_object('full_name', demo_name),
        now() - (random() * 365 || ' days')::interval
      )
      RETURNING id INTO user_id_val;

      -- Update profile if exists (created by trigger), otherwise skip
      UPDATE profiles
      SET full_name = demo_name, is_premium = random() < 0.15
      WHERE id = user_id_val;

      -- Create fake submissions (30-70% passed rate)
      FOR challenge_record IN
        SELECT id, points, test_cases
        FROM challenges
        ORDER BY random()
        LIMIT floor(random() * 15 + 5)::int -- 5-20 challenges per user
      LOOP
        IF random() < 0.65 THEN -- 65% pass rate
          INSERT INTO submissions (
            challenge_id, user_id, code, language, status,
            score, passed_test_cases, total_test_cases, created_at
          ) VALUES (
            challenge_record.id,
            user_id_val,
            '# Demo solution
print("Hello World")',
            CASE (i % 3) WHEN 0 THEN 'python' WHEN 1 THEN 'javascript' ELSE 'typescript' END,
            'passed',
            challenge_record.points,
            COALESCE(jsonb_array_length(challenge_record.test_cases::jsonb), 0),
            COALESCE(jsonb_array_length(challenge_record.test_cases::jsonb), 0),
            now() - (random() * 90 || ' days')::interval
          );
        END IF;
      END LOOP;
    END IF;

    user_id_val := NULL;
  END LOOP;

  -- Update leaderboard if view exists
  BEGIN
    REFRESH MATERIALIZED VIEW leaderboard;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'leaderboard view does not exist, skipping';
  END;

END $$;

-- Insert fake activity for today (to make site look active)
INSERT INTO submissions (challenge_id, user_id, code, language, status, score, created_at)
SELECT
  c.id,
  p.id,
  '# Solution',
  'python',
  'passed',
  c.points,
  now() - (random() * 8 || ' hours')::interval
FROM challenges c
CROSS JOIN (
  SELECT id FROM profiles
  WHERE email LIKE 'demo%@%'
  ORDER BY random()
  LIMIT 10
) p
WHERE random() < 0.7
ON CONFLICT DO NOTHING;

-- Summary
SELECT
  'Fake users created: ' || COUNT(*)::text as status
FROM profiles
WHERE email LIKE 'demo%@%'
UNION ALL
SELECT
  'Total fake submissions: ' || COUNT(*)::text
FROM submissions s
JOIN profiles p ON p.id = s.user_id
WHERE p.email LIKE 'demo%@%'
UNION ALL
SELECT
  'Leaderboard entries: ' || COUNT(*)::text
FROM (
  SELECT user_id FROM submissions s
  JOIN profiles p ON p.id = s.user_id
  WHERE p.email LIKE 'demo%@%'
  GROUP BY user_id
) t;
