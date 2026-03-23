'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Trophy, Flame, Target, Zap, Star, TrendingUp, Award, Lock, Unlock } from 'lucide-react';

interface ProgressStats {
  totalSubmissions: number;
  passedChallenges: number;
  totalChallenges: number;
  streakDays: number;
  currentLevel: number;
  experiencePoints: number;
  pointsToNextLevel: number;
  categoryProgress: Record<string, { completed: number; total: number }>;
}

interface Challenge {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  completed: boolean;
}

const SKILL_LEVELS = [
  { level: 1, name: 'Novice', points: 0, color: 'bg-gray-500' },
  { level: 2, name: 'Beginner', points: 100, color: 'bg-green-500' },
  { level: 3, name: 'Apprentice', points: 300, color: 'bg-emerald-500' },
  { level: 4, name: 'Intermediate', points: 600, color: 'bg-yellow-500' },
  { level: 5, name: 'Advanced', points: 1000, color: 'bg-orange-500' },
  { level: 6, name: 'Expert', points: 1500, color: 'bg-red-500' },
  { level: 7, name: 'Master', points: 2200, color: 'bg-purple-500' },
  { level: 8, name: 'Grandmaster', points: 3000, color: 'bg-indigo-500' },
  { level: 9, name: 'Legend', points: 4000, color: 'bg-fuchsia-500' },
  { level: 10, name: 'Champion', points: 5500, color: 'bg-amber-500' },
];

export default function ProgressPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    setLoading(true);

    // Get all submissions for this user
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    // Get all challenges
    const { data: allChallenges } = await supabase
      .from('challenges')
      .select('id, title, category, difficulty, points');

    if (allChallenges) {
      // Calculate unique passed challenges
      const passedChallengeIds = new Set(
        submissions?.filter(s => s.status === 'passed').map(s => s.challenge_id) || []
      );

      // Calculate total points earned
      const totalPoints = submissions
        ?.filter(s => s.status === 'passed')
        .reduce((sum, s) => sum + (s.score || 0), 0) || 0;

      // Map challenges with completion status
      const mappedChallenges = allChallenges.map(c => ({
        ...c,
        completed: passedChallengeIds.has(c.id),
      }));
      setChallenges(mappedChallenges);

      // Calculate category progress
      const categoryProgress: Record<string, { completed: number; total: number }> = {};
      mappedChallenges.forEach(c => {
        if (!categoryProgress[c.category]) {
          categoryProgress[c.category] = { completed: 0, total: 0 };
        }
        categoryProgress[c.category].total++;
        if (c.completed) {
          categoryProgress[c.category].completed++;
        }
      });

      // Calculate current level based on points
      const currentLevel = SKILL_LEVELS.reduce((acc, level) => {
        return totalPoints >= level.points ? level.level : acc;
      }, 1);

      const nextLevel = SKILL_LEVELS.find(l => l.level === currentLevel + 1);
      const pointsToNextLevel = nextLevel ? nextLevel.points - totalPoints : 0;

      // Calculate streak (simplified: unique days with submissions)
      const uniqueDays = new Set(
        submissions?.map(s => new Date(s.created_at).toDateString()) || []
      );
      const streakDays = uniqueDays.size;

      setStats({
        totalSubmissions: submissions?.length || 0,
        passedChallenges: passedChallengeIds.size,
        totalChallenges: allChallenges.length,
        streakDays,
        currentLevel,
        experiencePoints: totalPoints,
        pointsToNextLevel,
        categoryProgress,
      });
    }

    setLoading(false);
  };

  const getCurrentLevelInfo = () => {
    return SKILL_LEVELS.find(l => l.level === stats?.currentLevel) || SKILL_LEVELS[0];
  };

  const getNextLevelInfo = () => {
    return SKILL_LEVELS.find(l => l.level === (stats?.currentLevel || 0) + 1);
  };

  const getRecommendedChallenges = () => {
    return challenges
      .filter(c => !c.completed)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Progress Dashboard</h1>
        <p className="text-gray-600 mb-6">Please log in to view your progress.</p>
        <Link href="/login" className="text-primary-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const levelInfo = getCurrentLevelInfo();
  const nextLevel = getNextLevelInfo();
  const recommended = getRecommendedChallenges();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Your Progress</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8" />
              <span className="text-3xl font-bold">{stats.passedChallenges}</span>
            </div>
            <p className="text-blue-100">Challenges Completed</p>
            <p className="text-sm text-blue-200">of {stats.totalChallenges} total</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-8 h-8" />
              <span className="text-3xl font-bold">{stats.streakDays}</span>
            </div>
            <p className="text-orange-100">Day Streak</p>
            <p className="text-sm text-orange-200">Keep it going!</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8" />
              <span className="text-3xl font-bold">{stats.experiencePoints}</span>
            </div>
            <p className="text-purple-100">Total Points</p>
            <p className="text-sm text-purple-200">
              {nextLevel ? `${stats.pointsToNextLevel} to Level ${nextLevel.level}` : 'Max Level!'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8" />
              <span className="text-3xl font-bold">{stats.totalSubmissions}</span>
            </div>
            <p className="text-green-100">Total Submissions</p>
            <p className="text-sm text-green-200">Keep practicing!</p>
          </div>
        </div>
      )}

      {/* Level Progress */}
      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full ${levelInfo.color} flex items-center justify-center text-white text-2xl font-bold`}>
              {levelInfo.level}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{levelInfo.name}</h2>
              <p className="text-gray-600">Level {levelInfo.level} of {SKILL_LEVELS.length}</p>
            </div>
          </div>

          {nextLevel && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="bg-primary-600 rounded-full h-4 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      ((stats.experiencePoints - levelInfo.points) /
                        (nextLevel.points - levelInfo.points)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {stats.pointsToNextLevel} points needed for {nextLevel.name}
              </p>
            </>
          )}
        </div>
      )}

      {/* Skill Tree */}
      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            Skill Tree
          </h2>

          <div className="flex flex-wrap gap-4 justify-center">
            {SKILL_LEVELS.map((level) => {
              const isUnlocked = stats.currentLevel >= level.level;
              const isCurrent = stats.currentLevel === level.level;

              return (
                <div
                  key={level.level}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? 'border-primary-500 bg-primary-50 scale-110'
                      : isUnlocked
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-100 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full ${level.color} flex items-center justify-center text-white text-lg font-bold mx-auto mb-2`}>
                    {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <p className="text-center font-medium text-sm">{level.name}</p>
                  <p className="text-center text-xs text-gray-500">{level.points}+ pts</p>
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2">
                      <Award className="w-6 h-6 text-yellow-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Progress */}
      {stats && Object.keys(stats.categoryProgress).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary-600" />
            Category Progress
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.categoryProgress).map(([category, progress]) => {
              const percentage = Math.round((progress.completed / progress.total) * 100);

              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold capitalize">{category}</h3>
                    <span className="text-sm text-gray-600">{progress.completed}/{progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 rounded-full h-2 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{percentage}% complete</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Challenges */}
      {recommended.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary-600" />
            Recommended Next
          </h2>

          <div className="space-y-3">
            {recommended.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition group"
              >
                <div>
                  <h3 className="font-medium group-hover:text-primary-600 transition">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {challenge.category} • {challenge.difficulty}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-4 h-4" />
                  {challenge.points} pts
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recommended.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <Trophy className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-gray-600">You have completed all available challenges!</p>
          <Link
            href="/challenges"
            className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Browse Challenges
          </Link>
        </div>
      )}
    </div>
  );
}
