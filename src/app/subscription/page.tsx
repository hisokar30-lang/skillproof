'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { CreditCard, Calendar, AlertCircle, CheckCircle, XCircle, Crown } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  stripe_customer_id: string;
}

const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
  if (cancelAtPeriodEnd) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
        <Calendar className="w-4 h-4" />
        Canceling at period end
      </span>
    );
  }

  switch (status) {
    case 'active':
    case 'trialing':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4" />
          Active
        </span>
      );
    case 'past_due':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
          <AlertCircle className="w-4 h-4" />
          Past Due
        </span>
      );
    case 'canceled':
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
          <XCircle className="w-4 h-4" />
          Canceled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setSubscription(data);
    } catch (e) {
      console.error('Error fetching subscription:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;

    setCancelling(true);
    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.stripe_subscription_id }),
      });

      if (res.ok) {
        await fetchSubscription();
      } else {
        alert('Failed to cancel subscription. Please try again later.');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleManage = async () => {
    if (!user) return;

    setManaging(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setManaging(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Subscription</h1>
        <p className="text-gray-600 mb-6">Please log in to manage your subscription.</p>
        <Link href="/login" className="text-primary-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const formattedEndDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Your Subscription</h1>

      {/* Status Card */}
      <div className="bg-white rounded-xl shadow-md border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isActive ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gray-200'
            }`}>
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {isActive ? 'Premium Plan' : 'Free Plan'}
              </h2>
              <p className="text-gray-500">
                {isActive ? '$9.99/month' : 'Limited features'}
              </p>
            </div>
          </div>
          {subscription && getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
        </div>

        {/* Benefits List */}
        {isActive && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">Current Benefits:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✓ Unlimited challenge attempts</li>
              <li>✓ Detailed analytics & insights</li>
              <li>✓ Priority code judging</li>
              <li>✓ Full solution explanations</li>
              <li>✓ Progress dashboard</li>
            </ul>
          </div>
        )}

        {/* Billing Info */}
        {subscription && formattedEndDate && (
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {subscription.cancel_at_period_end
                  ? `Access until: ${formattedEndDate}`
                  : `Next billing: ${formattedEndDate}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>Monthly billing</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {isActive ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleManage}
            disabled={managing}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {managing ? 'Loading...' : 'Manage Billing'}
          </button>

          {!subscription.cancel_at_period_end && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 border-2 border-red-200 text-red-600 hover:bg-red-50 py-3 px-6 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              {cancelling ? 'Processing...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Unlock Premium Features</h3>
          <p className="text-gray-600 mb-6">
            Get unlimited challenges, detailed analytics, and priority support.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-primary-600 text-white py-3 px-8 rounded-lg hover:bg-primary-700 transition font-medium"
          >
            <Crown className="w-5 h-5" />
            Upgrade to Premium
          </Link>
        </div>
      )}
    </div>
  );
}
