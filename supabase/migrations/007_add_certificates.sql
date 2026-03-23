-- Add certificates table for Certificate System

CREATE TABLE IF NOT EXISTS certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_ids uuid[] NOT NULL,
    title TEXT NOT NULL,
    issue_date timestamptz DEFAULT now(),
    blockchain_hash TEXT,
    blockchain_verified BOOLEAN DEFAULT false,
    linkedin_shared BOOLEAN DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);

-- RLS policies
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own certificates" ON certificates;
CREATE POLICY "Users can insert own certificates" ON certificates FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own certificates" ON certificates;
CREATE POLICY "Users can update own certificates" ON certificates FOR UPDATE USING (auth.uid() = user_id);

-- Function to check if user is eligible for certificate
CREATE OR REPLACE FUNCTION check_certificate_eligibility(user_uuid uuid)
RETURNS TABLE (eligible BOOLEAN, completed_count INTEGER) AS $$
DECLARE
    completed_challenges INTEGER;
BEGIN
    SELECT COUNT(DISTINCT challenge_id) INTO completed_challenges
    FROM submissions
    WHERE user_id = user_uuid
    AND status = 'passed';

    RETURN QUERY SELECT completed_challenges >= 10, completed_challenges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Certificates table created' as status;
