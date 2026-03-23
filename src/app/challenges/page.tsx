'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Clock, Trophy } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  difficulty_level?: number;
  category: string;
  points: number;
  time_limit_minutes: number;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    const fetchChallenges = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true });
      if (data) setChallenges(data as Challenge[]);
      setLoading(false);
    };
    fetchChallenges();
  }, []);

  const categories = ['All', ...new Set(challenges.map(c => c.category))];

  const filteredChallenges = challenges.filter(c => {
    const difficultyMatch = difficultyFilter === null ||
      (difficultyFilter === 1 && c.difficulty_level && c.difficulty_level <= 3) ||
      (difficultyFilter === 2 && c.difficulty_level && c.difficulty_level > 3 && c.difficulty_level <= 6) ||
      (difficultyFilter === 3 && c.difficulty_level && c.difficulty_level > 6);
    const categoryMatch = categoryFilter === 'All' || c.category === categoryFilter;
    return difficultyMatch && categoryMatch;
  });

  const getDifficultyColor = (level?: number) => {
    if (!level) return 'bg-gray-100 text-gray-800';
    if (level <= 3) return 'bg-green-100 text-green-800';
    if (level <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Coding Challenges</h1>
        <p className="text-gray-600">Master coding from Level 1 to Level 10</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4 items-center justify-center">
        <div className="flex gap-2">
          {[
            { label: 'All', value: null },
            { label: 'Beginner (1-3)', value: 1 },
            { label: 'Intermediate (4-6)', value: 2 },
            { label: 'Advanced (7-10)', value: 3 },
          ].filter(f => f.value !== null).map((filter) => (
            <button
              key={filter.label}
              onClick={() => setDifficultyFilter(difficultyFilter === filter.value ? null : filter.value as number)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                difficultyFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Challenge Progress</span>
          <span className="text-primary-600 font-bold">
            {challenges.length} challenges available
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-3">
          <div className="bg-primary-500 h-3 rounded-full transition-all" style={{ width: '0%' }}></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Complete challenges to level up!
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map(challenge => (
          <div key={challenge.id} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition bg-white">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold line-clamp-1">{challenge.title}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty_level)}`}>
                Level {challenge.difficulty_level || '-'}
              </span>
            </div>
            <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{challenge.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                {challenge.points} pts
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {challenge.time_limit_minutes} min
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-4">{challenge.category}</div>
            <Link
              href={`/challenges/${challenge.id}`}
              className="block w-full text-center bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 transition"
            >
              Start Challenge
            </Link>
          </div>
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No challenges found for selected filters.</p>
          <button
            onClick={() => { setDifficultyFilter(null); setCategoryFilter('All'); }}
            className="mt-4 text-primary-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
