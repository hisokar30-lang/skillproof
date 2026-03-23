import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper to unwrap Stripe response
const unwrapStripeResponse = (response: any): any => {
  return response.id ? response : response.result;
};

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabaseUserId;

        if (!userId) {
          console.error('No userId in session metadata');
          return NextResponse.json({ error: 'No userId' }, { status: 400 });
        }

        // Get subscription details
        const subscriptionRaw = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const subscription = unwrapStripeResponse(subscriptionRaw);

        // Upsert subscription record
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          current_period_start: new Date((subscription.current_period_start || 0) * 1000),
          current_period_end: new Date((subscription.current_period_end || 0) * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date(),
        }, {
          onConflict: 'stripe_subscription_id'
        });

        // Update profile
        await supabase
          .from('profiles')
          .update({ is_premium: true })
          .eq('id', userId);

        break;
      }

      case 'invoice.paid': {
        const invoiceObj = (event.data.object as any);
        const subscriptionId = invoiceObj.subscription as string | null;

        if (subscriptionId) {
          const subscriptionRaw = await stripe.subscriptions.retrieve(subscriptionId);
          const subscription = unwrapStripeResponse(subscriptionRaw);

          await supabase
            .from('subscriptions')
            .upsert({
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              stripe_price_id: subscription.items.data[0].price.id,
              status: subscription.status,
              current_period_start: new Date((subscription.current_period_start || 0) * 1000),
              current_period_end: new Date((subscription.current_period_end || 0) * 1000),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date(),
            }, {
              onConflict: 'stripe_subscription_id'
            });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscriptionRaw = event.data.object as any;
        const subscription = unwrapStripeResponse(subscriptionRaw);

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date((subscription.current_period_start || 0) * 1000),
            current_period_end: new Date((subscription.current_period_end || 0) * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update premium status
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (sub) {
          await supabase
            .from('profiles')
            .update({ is_premium: subscription.status === 'active' || subscription.status === 'trialing' })
            .eq('id', sub.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscriptionRaw = event.data.object as any;
        const subscription = unwrapStripeResponse(subscriptionRaw);

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date(),
          })
          .eq('stripe_subscription_id', subscription.id);

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (sub) {
          await supabase
            .from('profiles')
            .update({ is_premium: false })
            .eq('id', sub.user_id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
