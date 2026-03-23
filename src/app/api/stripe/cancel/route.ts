import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription ID' }, { status: 400 });
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      { cancel_at_period_end: true }
    ) as any;

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (error: any) {
    console.error('Stripe cancel error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
