'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

interface UsageData {
  challengesAttempted: number;
  challengesCompleted: number;
  month: number;
  year: number;
}

const FREE_TIER_LIMIT = 10;

export function useUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Fetch usage data
      const { data: usageData, error: usageError } = await supabase
        .from('user_monthly_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)
        .single();

      // Fetch premium status from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        setError(usageError.message);
      } else {
        setUsage(usageData || {
          challengesAttempted: 0,
          challengesCompleted: 0,
          month,
          year
        });
      }

      if (profileData) {
        setIsPremium(profileData.is_premium || false);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const canSubmit = () => {
    if (!user) return false;
    if (isPremium) return true; // Premium users have unlimited submissions
    if (!usage) return true; // Allow if we haven't loaded yet
    return usage.challengesAttempted < FREE_TIER_LIMIT;
  };

  const remainingAttempts = () => {
    if (isPremium) return Infinity; // Premium users have unlimited
    if (!usage) return FREE_TIER_LIMIT;
    return Math.max(0, FREE_TIER_LIMIT - usage.challengesAttempted);
  };

  return {
    usage,
    loading,
    error,
    canSubmit: canSubmit(),
    remainingAttempts: remainingAttempts(),
    isPremium,
    FREE_TIER_LIMIT
  };
}
