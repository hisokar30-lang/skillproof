'use client';

import { useEffect, useState } from 'react';
import { Users, Zap, Trophy, TrendingUp } from 'lucide-react';

interface Stats {
  users: number;
  submissions: number;
  challenges: number;
  online: number;
}

export default function SocialProofBanner() {
  const [stats, setStats] = useState<Stats>({ users: 0, submissions: 0, challenges: 0, online: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();

      // Get user count
      const { count: users } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get submission count
      const { count: submissions } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      // Get challenge count
      const { count: challenges } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true });

      // Simulate online users (5-15% of total)
      const online = Math.floor((users || 0) * (0.05 + Math.random() * 0.1));

      setStats({
        users: users || 0,
        submissions: submissions || 0,
        challenges: challenges || 0,
        online,
      });
    } catch (e) {
      // Silent fail
    }
    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          {stats.users > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>
                <strong>{stats.users.toLocaleString()}</strong> developers
              </span>
            </div>
          )}
          {stats.submissions > 0 && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>
                <strong>{stats.submissions.toLocaleString()}</strong> submissions
              </span>
            </div>
          )}
          {stats.challenges > 0 && (
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>
                <strong>{stats.challenges}</strong> challenges
              </span>
            </div>
          )}
          {stats.online > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>
                <strong>{stats.online}</strong> online now
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
