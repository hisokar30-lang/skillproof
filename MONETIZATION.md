# SkillProof Monetization Strategies

## 1. Freemium Subscription (Recommended)

### Free Tier
- 10 challenges per month
- Beginner difficulty only
- Basic profile & leaderboard
- Ad-supported (optional)

### Premium ($9.99/month or $99/year)
- Unlimited challenges
- All difficulty levels
- Detailed analytics dashboard
- Performance insights
- Verified certificates
- Priority code judging
- Offline challenge downloads

### Implementation Steps
1. Add `subscriptions` table to Supabase
2. Integrate Stripe for payments
3. Add paywall middleware
4. Create pricing page

## 2. Corporate/B2B Hiring Platform

Companies pay to:
- Create custom assessments for candidates
- Access candidate pool
- Use white-labeled challenge platform
- Get detailed skill reports

**Pricing:** $299-$999/month per company

### Features:
- Custom challenge creation
- Candidate tracking dashboard
- Plagiarism detection
- Skill assessment reports
- ATS integration (Greenhouse, Lever)

## 3. Verified Certificates

Pay-per-certificate model:
- Complete 10 challenges in a category
- Pass proctored assessment
- Get blockchain-verified certificate

**Pricing:** $29-$99 per certificate

Categories:
- Python Developer Certificate
- JavaScript Developer Certificate
- Algorithm Fundamentals Certificate
- Data Structures Certificate

## 4. Job Board (Marketplace)

Companies pay to post jobs:
- Target candidates by skill level
- Filter by completed challenges
- Direct messaging to top performers

**Pricing:** $199-$499 per job post

Revenue split: 70% to SkillProof, 30% to referral

## 5. Sponsored Challenges

Tech companies sponsor challenges:
- "Build a React Component" sponsored by Meta
- "AWS Lambda Challenge" sponsored by Amazon
- Winners get prizes + interviews

**Sponsorship:** $1,000-$10,000 per challenge

## 6. Premium Features Ala Carte

- **Resume Review:** $49
- **1-on-1 Mentoring:** $75/hour
- **Mock Interviews:** $99
- **Code Review:** $29 per submission

## 7. API Access

Developers/EdTech companies pay for API:
- Embed challenges in their platform
- Access challenge database
- Use judging system

**Pricing:**
- Free: 100 requests/month
- Basic ($49/month): 10,000 requests
- Pro ($199/month): 100,000 requests
- Enterprise: Custom pricing

## 8. Affiliate Marketing

Recommend resources and earn commission:
- Coding courses (Udemy, Coursera)
- Books (Amazon)
- Developer tools (GitHub Copilot, JetBrains)
- Bootcamps

## Quick Start: Stripe Integration

```typescript
// Install: npm install stripe

// pages/api/checkout.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: Request) {
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'SkillProof Premium' },
        unit_amount: 999, // $9.99
        recurring: { interval: 'month' }
      },
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return Response.json({ url: session.url });
}
```

## Database Schema for Subscriptions

```sql
-- Add to supabase migrations
CREATE TABLE subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
    current_period_start timestamptz,
    current_period_end timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
```

## Webhook Handler

```typescript
// pages/api/webhooks/stripe.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = headers().get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await supabase.from('subscriptions').upsert({
        user_id: session.client_reference_id,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'active',
      });
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await supabase.from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);
      break;
  }

  return Response.json({ received: true });
}
```

## Recommended Launch Strategy

1. **Phase 1 (Now):** Build user base, keep everything free
2. **Phase 2 (1000 users):** Launch Premium subscription
3. **Phase 3 (5000 users):** Add certificates
4. **Phase 4 (10000 users):** Launch B2B hiring platform
5. **Phase 5 (50000 users):** Job board + Sponsorships

## Projected Revenue (with 10,000 active users)

| Revenue Stream | Monthly Revenue |
|---------------|-----------------|
| Premium Subscriptions (5% conversion) | $4,995 |
| Certificates (2% monthly) | $5,800 |
| Job Board (10 postings) | $2,990 |
| Sponsorships (2/month) | $4,000 |
| **Total** | **~$17,785/month** |

## Next Steps

1. Set up Stripe account: https://stripe.com
2. Create pricing page
3. Add subscription checks to challenge access
4. Set up webhook endpoint
5. Test payment flow

Would you like me to implement any of these features?
