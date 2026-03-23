'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Profile, Score } from '@/types';
import ProfileSettings from '@/components/ProfileSettings';
import Link from 'next/link';
import { Mail, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    const { data: scoresData } = await supabase
      .from('scores')
      .select(`
        *,
        challenge:challenge_id (title, points)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (scoresData) setScores(scoresData as any);

    const { data: badgesData } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badge_id (*)
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });
    if (badgesData) setBadges(badgesData.map((ub: any) => ({ ...ub.badge, earned_at: ub.earned_at })));

    setLoading(false);
  };

  const handleCopyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile/${user?.id}`;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Profile link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return <div className="container mx-auto py-12 text-center">Please log in to view your profile.</div>;
  }

  if (loading) {
    return <div className="container mx-auto py-12 text-center">Loading profile...</div>;
  }

  const totalPoints = profile?.total_points || scores.reduce((sum, s) => sum + s.points_earned, 0);
  const completedCount = profile?.challenges_completed || scores.filter(s => s.passed).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-4xl font-bold">Your Profile</h1>
        <div className="flex gap-3">
          <button
            onClick={handleCopyProfileLink}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <ProfileSettings profile={profile} onUpdate={setProfile} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">{profile?.full_name || user.email}</h2>
            {profile?.is_public !== false && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Public</span>
            )}
          </div>

          {/* Registered Email (Owner only) */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Mail className="w-4 h-4" />
              <span>Registered Email</span>
            </div>
            <p className="font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">Private • Only visible to you</p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Bio</h3>
            <p className="text-gray-600">{profile?.bio || 'No bio yet. Click Edit Profile to add one.'}</p>
          </div>

          {profile?.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline block">
              {profile.website}
            </a>
          )}

          {/* Public Profile Link */}
          <Link
            href={`/profile/${user.id}`}
            className="mt-4 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition"
          >
            <Share2 className="w-4 h-4" />
            View Public Profile
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Statistics</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-primary-50 p-4 rounded">
              <div className="text-3xl font-bold text-primary-700">{totalPoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-3xl font-bold text-green-700">{completedCount}</div>
              <div className="text-sm text-gray-600">Challenges Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Badges</h3>
          {badges.length === 0 ? (
            <p className="text-gray-600">No badges earned yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className="text-center">
                  <div className="text-3xl">{badge.icon}</div>
                  <div className="text-sm font-medium mt-1">{badge.name}</div>
                  <div className="text-xs text-gray-500">{new Date(badge.earned_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4">Your Scores</h3>
        {scores.length === 0 ? (
          <p className="text-gray-600">No scores yet. Complete challenges to earn points!</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Challenge</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scores.map(score => (
                <tr key={score.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(score as any).challenge?.title || 'Unknown Challenge'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{score.points_earned}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      score.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {score.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(score.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
