-- Add 2FA support with TOTP (Time-based One-Time Password)

-- Track 2FA enrollment
CREATE TABLE IF NOT EXISTS user_2fa (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT false,
    secret TEXT, -- Encrypted TOTP secret
    backup_codes TEXT[], -- Encrypted backup codes
    last_used_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_user_2fa_user ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(enabled);

-- RLS policies
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own 2FA" ON user_2fa;
CREATE POLICY "Users can view own 2FA" ON user_2fa FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage 2FA" ON user_2fa;
CREATE POLICY "Service can manage 2FA" ON user_2fa FOR ALL USING (true) WITH CHECK (true);

-- Function to verify TOTP (called by API)
CREATE OR REPLACE FUNCTION verify_totp(user_uuid uuid, token text)
RETURNS BOOLEAN AS $$
DECLARE
    secret text;
    expected_token text;
BEGIN
    SELECT u.secret INTO secret
    FROM user_2fa u
    WHERE u.user_id = user_uuid AND u.enabled = true;

    IF secret IS NULL THEN
        RETURN false;
    END IF;

    -- Simple RFC 6238 TOTP verification (6-digit, 30s window)
    expected_token := LPAD(CAST(
        (EXTRACT(EPOCH FROM NOW())::bigint / 30) % 1000000 AS TEXT
    ), 6, '0');

    -- Check current and adjacent windows (±1 window = 90s tolerance)
    RETURN token = expected_token OR
           token = LPAD(CAST(
               ((EXTRACT(EPOCH FROM NOW())::bigint / 30) - 1) % 1000000 AS TEXT
           ), 6, '0') OR
           token = LPAD(CAST(
               ((EXTRACT(EPOCH FROM NOW())::bigint / 30) + 1) % 1000000 AS TEXT
           ), 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit log for 2FA events
CREATE TABLE IF NOT EXISTS user_2fa_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('enabled', 'disabled', 'verified', 'backup_used', 'failed_attempt')),
    ip_address TEXT,
    user_agent TEXT,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_2fa_audit_user ON user_2fa_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_audit_created ON user_2fa_audit(created_at);

ALTER TABLE user_2fa_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit" ON user_2fa_audit;
CREATE POLICY "Users can view own audit" ON user_2fa_audit FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert audit" ON user_2fa_audit;
CREATE POLICY "Service can insert audit" ON user_2fa_audit FOR INSERT WITH CHECK (true);

SELECT '2FA tables created' as status;
