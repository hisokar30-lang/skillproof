-- Add daily_challenges table for featured/rotating challenges

CREATE TABLE IF NOT EXISTS daily_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
    featured_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_premium_only BOOLEAN DEFAULT false,
    bonus_points INTEGER DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(featured_date, challenge_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(featured_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_featured ON daily_challenges(challenge_id, featured_date);

-- Function to get today's daily challenge
CREATE OR REPLACE FUNCTION get_daily_challenge(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    id uuid,
    title TEXT,
    category TEXT,
    difficulty TEXT,
    points INTEGER,
    time_limit_minutes INTEGER,
    is_premium_only BOOLEAN,
    bonus_points INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id AS dc_id,
        c.title,
        c.category,
        c.difficulty,
        c.points,
        c.time_limit_minutes,
        dc.is_premium_only,
        dc.bonus_points
    FROM daily_challenges dc
    JOIN challenges c ON c.id = dc.challenge_id
    WHERE dc.featured_date = target_date
    ORDER BY dc.created_at
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get streak info
CREATE OR REPLACE FUNCTION get_streak_info(user_uuid uuid)
RETURNS TABLE (
    current_streak INTEGER,
    longest_streak INTEGER,
    last_active_date DATE,
    streak_continues BOOLEAN
) AS $$
DECLARE
    user_streak INTEGER;
    record RECORD;
BEGIN
    -- Get completion dates
    WITH user_activity AS (
        SELECT DISTINCT DATE(created_at) AS activity_date
        FROM submissions
        WHERE user_id = user_uuid
        AND status = 'passed'
        ORDER BY activity_date DESC
    ),
    streak_calc AS (
        SELECT
            activity_date,
            activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::integer AS streak_group
        FROM user_activity
    )
    SELECT
        COUNT(*) AS current_streak,
        MAX(activity_date) AS last_date
    INTO record
    FROM streak_calc
    WHERE streak_group = (
        SELECT streak_group FROM streak_calc LIMIT 1
    );

    RETURN QUERY SELECT
        COALESCE(record.current_streak, 0)::INTEGER,
        (SELECT COUNT(*)::INTEGER FROM user_activity), -- Simplified longest
        record.last_date,
        (record.last_date = CURRENT_DATE - INTERVAL '1 day') OR (record.last_date = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Daily challenges are viewable by everyone" ON daily_challenges;
CREATE POLICY "Daily challenges are viewable by everyone" ON daily_challenges FOR SELECT USING (true);

-- Insert sample daily challenge for today (using existing challenge)
INSERT INTO daily_challenges (challenge_id, featured_date, bonus_points)
SELECT id, CURRENT_DATE, 50
FROM challenges
WHERE difficulty = 'beginner'
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;

SELECT 'Daily challenges setup complete' as status;
