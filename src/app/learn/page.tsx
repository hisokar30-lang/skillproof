'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';

interface LearningResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty_level: number;
  tags: string[];
  estimated_read_time: number;
}

export default function LearnPage() {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase
        .from('learning_resources')
        .select('*')
        .eq('is_published', true)
        .order('difficulty_level', { ascending: true });

      if (data) setResources(data);
      setLoading(false);
    };
    fetchResources();
  }, []);

  const categories = ['All', ...new Set(resources.map(r => r.category))];

  const filteredResources = resources.filter(r => {
    const categoryMatch = selectedCategory === 'All' || r.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === null || r.difficulty_level === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return 'bg-green-100 text-green-800';
    if (level <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <BookOpen className="w-10 h-10 text-primary-600" />
          Learn & Level Up
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master coding concepts with our free open-source learning resources.
          Each lesson prepares you for coding challenges.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4 items-center justify-center">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-gray-500">Difficulty:</span>
          <select
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value ? parseInt(e.target.value) : null)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Levels</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Learning Path Progress</span>
          <span className="text-primary-600 font-bold">
            {resources.length} lessons available
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-3">
          <div className="bg-primary-500 h-3 rounded-full" style={{ width: '0%' }}></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Complete lessons to unlock advanced challenges!
        </p>
      </div>

      {/* Resources Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map(resource => (
          <Link
            key={resource.id}
            href={`/learn/${resource.slug}`}
            className="group bg-white border rounded-lg p-6 hover:shadow-lg transition hover:border-primary-300"
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(resource.difficulty_level)}`}>
                Level {resource.difficulty_level}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {resource.estimated_read_time} min
              </span>
            </div>

            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600 transition">
              {resource.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {resource.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {resource.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center text-primary-600 font-medium">
              Start Learning
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No resources found for selected filters.</p>
        </div>
      )}
    </div>
  );
}
