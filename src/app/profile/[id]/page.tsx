import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Award, Trophy, Calendar, Code, ArrowLeft } from 'lucide-react';

interface PublicProfilePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PublicProfilePageProps) {
  return {
    title: `Profile - SkillProof`,
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const supabase = createServerSupabaseClient();

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      user_badges:user_badges(
        earned_at,
        badge:badges(*)
      )
    `)
    .eq('id', params.id)
    .single();

  if (!profile || profile.is_public === false) {
    notFound();
  }

  // Fetch public stats
  const { data: stats } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: rankData } = await supabase
    .from('leaderboard')
    .select('rank')
    .eq('user_id', params.id)
    .single();

  const completedCount = stats?.filter((s: any) => s.passed).length || 0;
  const totalPoints = stats?.reduce((sum: number, s: any) => sum + (s.points_earned || 0), 0) || 0;
  const badges = profile.user_badges?.map((ub: any) => ub.badge) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leaderboard
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold">
              {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.full_name || 'Anonymous User'}
              </h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline text-sm mt-1 inline-block"
                >
                  {profile.website}
                </a>
              )}
            </div>
          </div>

          {/* Rank Badge */}
          {rankData?.rank && (
            <div className="flex items-center gap-3 bg-yellow-50 px-4 py-2 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Global Rank</p>
                <p className="text-2xl font-bold text-yellow-700">#{rankData.rank}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">{totalPoints}</div>
          <div className="text-gray-600">Total Points</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">{completedCount}</div>
          <div className="text-gray-600">Challenges Completed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">{badges.length}</div>
          <div className="text-gray-600">Badges Earned</div>
        </div>
      </div>

      {/* Badges Section */}
      {badges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Badges
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {badges.map((badge: any) => (
              <div
                key={badge.id}
                className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="font-medium text-sm text-gray-900">{badge.name}</div>
                <div className="text-xs text-gray-500 mt-1">{badge.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats && stats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary-600" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {stats.slice(0, 5).map((score: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      score.passed ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-gray-700">
                    {score.passed ? 'Passed' : 'Attempted'} challenge
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{score.points_earned} points</span>
                  <span>{new Date(score.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
