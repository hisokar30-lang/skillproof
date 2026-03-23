'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Check, Sparkles, Zap, Shield } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with SkillProof',
    features: [
      '10 challenge attempts per month',
      'Basic progress tracking',
      'Standard code editor',
      'Community discussions',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: false,
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    description: 'Unlock your full potential',
    features: [
      'Unlimited challenge attempts',
      'Detailed analytics & insights',
      'Priority code judging',
      'Solution explanations',
      'Progress dashboard',
      'AI code hints',
      'Ad-free experience',
    ],
    cta: 'Upgrade to Premium',
    href: '#checkout',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
  },
];

export default function PricingPage() {
  const { user, loading } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded w-2/3 mx-auto"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your <span className="text-primary-600">Plan</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Level up your coding skills with Premium. Get unlimited access to all challenges,
          detailed analytics, and exclusive features.
        </p>
        <div className="flex justify-center items-center gap-2 mt-4">
          <Shield className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-500">30-day money-back guarantee</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-8 border-2 transition-all ${
              plan.popular
                ? 'border-primary-500 bg-gradient-to-b from-primary-50/50 to-white shadow-xl scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-600">{plan.description}</p>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold">{plan.price}</span>
              <span className="text-gray-500">{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      plan.popular ? 'text-primary-600' : 'text-green-500'
                    }`}
                  />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {plan.popular ? (
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {user ? plan.cta : 'Sign Up & Upgrade'}
                  </>
                )}
              </button>
            ) : (
              <Link
                href={plan.href}
                className="w-full block text-center border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition"
              >
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600 text-sm">
              Yes! You can cancel your subscription at any time. You will continue to have
              access until the end of your billing period.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What payment methods are accepted?</h3>
            <p className="text-gray-600 text-sm">
              We accept all major credit cards, debit cards, and PayPal through Stripe.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-gray-600 text-sm">
              Yes! Start with the Free plan and upgrade whenever you're ready. No
              credit card required for the free tier.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="text-center mt-12 text-gray-500 text-sm">
        <p>Secured by Stripe • Cancel anytime • 30-day money-back guarantee</p>
      </div>
    </div>
  );
}
