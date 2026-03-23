'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUsage } from '@/hooks/useUsage';
import { Sparkles, Clock, Target, Flame, CheckCircle, Lock } from 'lucide-react';

interface DailyChallenge {
  id: string;
  challenge_id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  bonus_points: number;
  is_premium_only: boolean;
  completed: boolean;
}

interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  streak_continues: boolean;
}

export default function DailyChallenge() {
  const { user } = useAuth();
  const { isPremium } = useUsage();
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [streak, setStreak] = useState<StreakInfo>({ current_streak: 0, longest_streak: 0, streak_continues: false });
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    fetchDailyChallenge();
    fetchStreakInfo();

    // Calculate time until midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    setTimeRemaining(Math.floor(timeUntilMidnight / 1000));

    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          fetchDailyChallenge();
          return 86400; // Reset to 24 hours
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  const fetchDailyChallenge = async () => {
    setLoading(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();

      // Get today's daily challenge
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyData } = await supabase
        .from('daily_challenges')
        .select(`
          *,
          challenge:challenge_id(
            id,
            title,
            category,
            difficulty,
            points
          )
        `)
        .eq('featured_date', today)
        .single();

      if (dailyData?.challenge) {
        // Check if completed
        let completed = false;
        if (user) {
          const { data: submission } = await supabase
            .from('submissions')
            .select('id')
            .eq('challenge_id', dailyData.challenge.id)
            .eq('user_id', user.id)
            .eq('status', 'passed')
            .limit(1)
            .single();
          completed = !!submission;
        }

        setDailyChallenge({
          id: dailyData.id,
          challenge_id: dailyData.challenge.id,
          title: dailyData.challenge.title,
          category: dailyData.challenge.category,
          difficulty: dailyData.challenge.difficulty,
          points: dailyData.challenge.points,
          bonus_points: dailyData.bonus_points,
          is_premium_only: dailyData.is_premium_only,
          completed,
        });
      }
    } catch (e) {
      console.error('Error fetching daily challenge:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreakInfo = async () => {
    if (!user) return;
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .rpc('get_streak_info', { user_uuid: user.id });

      if (data && data.length > 0) {
        setStreak(data[0]);
      }
    } catch (e) {
      console.error('Error fetching streak info:', e);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
        <div className="h-6 bg-white/50 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-white/50 rounded"></div>
      </div>
    );
  }

  if (!dailyChallenge) return null;

  const totalPoints = dailyChallenge.points + dailyChallenge.bonus_points;

  return (
    <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 rounded-xl p-6 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Daily Challenge</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeRemaining)} left</span>
          </div>
          {user && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              streak.current_streak > 0 ? 'bg-orange-500' : 'bg-white/20'
            }`}>
              <Flame className="w-4 h-4" />
              <span>{streak.current_streak} day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Challenge Card */}
      <Link
        href={`/challenges/${dailyChallenge.challenge_id}`}
        className={`block bg-white rounded-lg p-4 text-gray-900 hover:shadow-lg transition group ${
          dailyChallenge.is_premium_only && !isPremium ? 'opacity-75' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-bold text-lg group-hover:text-primary-600 transition">
              {dailyChallenge.title}
            </h4>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(dailyChallenge.difficulty)}`}>
                {dailyChallenge.difficulty}
              </span>
              <span className="text-gray-500 capitalize">{dailyChallenge.category}</span>
            </div>
          </div>

          {/* Points */}
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {totalPoints}
              <span className="text-sm font-normal text-gray-500 ml-1">pts</span>
            </div>
            {dailyChallenge.bonus_points > 0 && (
              <div className="text-xs text-green-600 font-medium">
                +{dailyChallenge.bonus_points} bonus
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-sm">
            {dailyChallenge.completed ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Completed today!
              </span>
            ) : dailyChallenge.is_premium_only && !isPremium ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Lock className="w-4 h-4" />
                Premium only
              </span>
            ) : streak.current_streak > 0 ? (
              <span className="flex items-center gap-1 text-orange-600">
                <Target className="w-4 h-4" />
                Maintain your streak!
              </span>
            ) : (
              <span className="text-gray-500">Start your streak today</span>
            )}
          </div>

          <span className="text-primary-600 font-medium group-hover:underline">
            {dailyChallenge.completed ? 'View Solution' : 'Solve Challenge'}
          </span>
        </div>
      </Link>

      {/* Streak Rewards */}
      {streak.current_streak > 0 && (
        <div className="mt-4 bg-white/10 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Streak Rewards:</span>
            <div className="flex gap-2">
              {streak.current_streak >= 3 && (
                <span className="bg-yellow-400/20 px-2 py-0.5 rounded text-yellow-200">
                  🔥 3-day bonus EP
                </span>
              )}
              {streak.current_streak >= 7 && (
                <span className="bg-purple-400/20 px-2 py-0.5 rounded text-purple-200">
                  💎 7-day badge
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
