'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Medal, Crown, Filter, Calendar, Target, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  email: string;
  total_points: number;
  challenges_completed: number;
  category?: string;
}

type Timeframe = 'all_time' | 'weekly' | 'monthly';

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('all_time');
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchLeaderboard();
  }, [timeframe, category]);

  const fetchCategories = async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('challenges')
        .select('category')
        .neq('category', null);

      if (data) {
        const unique = [...new Set(data.map(c => c.category).filter(Boolean))];
        setCategories(unique);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();

      let query = supabase
        .from('submissions')
        .select(`
          user_id,
          points:score,
          status,
          created_at,
          challenge:challenge_id(category)
        `)
        .eq('status', 'passed');

      // Apply timeframe filter
      if (timeframe === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', weekAgo);
      } else if (timeframe === 'monthly') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', monthAgo);
      }

      const { data: submissions } = await query;

      // Aggregate by user
      const userStats: Record<string, LeaderboardEntry> = {};

      submissions?.forEach((sub: any) => {
        if (category && sub.challenge?.category !== category) return;

        const userId = sub.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            user_id: userId,
            full_name: '',
            email: '',
            total_points: 0,
            challenges_completed: 0,
          };
        }
        userStats[userId].total_points += sub.points || 0;
        userStats[userId].challenges_completed += 1;
      });

      // Fetch user profiles
      const userIds = Object.keys(userStats);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        profiles?.forEach((profile: any) => {
          if (userStats[profile.id]) {
            userStats[profile.id].full_name = profile.full_name;
            userStats[profile.id].email = profile.email;
          }
        });
      }

      const sorted = Object.values(userStats)
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 50);

      setLeaderboard(sorted);
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 0:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300';
      case 1:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300';
      case 2:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const isCurrentUser = (userId: string) => currentUser?.id === userId;

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto"></div>
          <div className="flex justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 w-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-gray-600">Compete with the best developers</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Timeframe */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['all_time', 'weekly', 'monthly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    timeframe === t
                      ? 'bg-white shadow-sm text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t === 'all_time' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={category || ''}
              onChange={(e) => setCategory(e.target.value || null)}
              className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No scores yet for this timeframe. Be the first to complete a challenge!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="flex justify-center items-end gap-4 mb-12">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="text-center order-1">
                  <div className="w-24 h-28 bg-gradient-to-b from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                      2
                    </div>
                    <Medal className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold truncate w-24 mx-auto">
                      {topThree[1].full_name || topThree[1].email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-primary-600 font-medium">{topThree[1].total_points} pts</p>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="text-center order-2 -mt-4">
                  <div className="w-28 h-36 bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-t-lg flex items-center justify-center relative shadow-lg">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Crown className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="absolute top-4 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      1
                    </div>
                    <Trophy className="w-16 h-16 text-yellow-600" />
                  </div>
                  <div className="mt-3">
                    <p className="font-bold text-lg truncate w-32 mx-auto">
                      {topThree[0].full_name || topThree[0].email}
                    </p>
                    <p className="text-sm text-primary-600 font-bold">{topThree[0].total_points} pts</p>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="text-center order-3">
                  <div className="w-24 h-24 bg-gradient-to-b from-orange-100 to-orange-200 rounded-t-lg flex items-center justify-center relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                      3
                    </div>
                    <Medal className="w-10 h-10 text-orange-500" />
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold truncate w-24 mx-auto">
                      {topThree[2].full_name || topThree[2].email}
                    </p>
                    <p className="text-sm text-primary-600 font-medium">{topThree[2].total_points} pts</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rest of Rankings */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-3xl mx-auto">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                Rankings
              </h3>
            </div>
            <div className="divide-y">
              {rest.map((entry, index) => {
                const rank = index + 4;
                const isMe = isCurrentUser(entry.user_id);
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition ${
                      isMe ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-10 text-center">
                      <span className="text-lg font-bold text-gray-400">#{rank}</span>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                      {getInitials(entry.full_name || entry.email)}
                    </div>

                    <div className="flex-grow">
                      <p className="font-medium">
                        {entry.full_name || entry.email}
                        {isMe && (
                          <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{entry.challenges_completed} challenges</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600">{entry.total_points}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Call to action */}
      {!currentUser && (
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Want to join the leaderboard?</p>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-medium"
          >
            <Target className="w-5 h-5" />
            Start Solving Challenges
          </Link>
        </div>
      )}
    </div>
  );
}
