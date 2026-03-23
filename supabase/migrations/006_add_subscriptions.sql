-- Add subscriptions table for Stripe integration

CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid')),
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(stripe_subscription_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Function to check if user has active premium subscription
CREATE OR REPLACE FUNCTION is_premium_user(user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = user_uuid
        AND status IN ('active', 'trialing')
        AND (current_period_end IS NULL OR current_period_end > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user's premium status in profiles
CREATE OR REPLACE FUNCTION update_user_premium_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('active', 'trialing') THEN
        UPDATE profiles SET is_premium = true WHERE id = NEW.user_id;
    ELSE
        -- Check if user has any other active subscriptions
        IF NOT EXISTS (
            SELECT 1 FROM subscriptions
            WHERE user_id = NEW.user_id
            AND status IN ('active', 'trialing')
            AND id != NEW.id
        ) THEN
            UPDATE profiles SET is_premium = false WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update premium status on subscription change
DROP TRIGGER IF EXISTS subscription_status_change ON subscriptions;
CREATE TRIGGER subscription_status_change
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_premium_status();

-- Add is_premium column to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'is_premium'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
        CREATE INDEX idx_profiles_premium ON profiles(is_premium);
    END IF;
END $$;

-- Verify setup
SELECT 'Subscriptions table created successfully' as status;
