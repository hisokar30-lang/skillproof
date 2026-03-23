'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Clock, BookOpen, ChevronRight } from 'lucide-react';

interface LearningResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  difficulty_level: number;
  tags: string[];
  related_challenge_ids: string[];
  estimated_read_time: number;
}

export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lesson, setLesson] = useState<LearningResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedChallenges, setRelatedChallenges] = useState<any[]>([]);

  useEffect(() => {
    const fetchLesson = async () => {
      const { data } = await supabase
        .from('learning_resources')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (data) {
        setLesson(data);

        // Fetch related challenges
        if (data.related_challenge_ids?.length > 0) {
          const { data: challenges } = await supabase
            .from('challenges')
            .select('id, title, difficulty_level')
            .in('id', data.related_challenge_ids);
          setRelatedChallenges(challenges || []);
        }
      }
      setLoading(false);
    };
    fetchLesson();
  }, [slug]);

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return 'bg-green-100 text-green-800';
    if (level <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
        <Link href="/learn" className="text-primary-600 hover:underline">
          Back to Learning
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/learn"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lessons
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(lesson.difficulty_level)}`}>
              Level {lesson.difficulty_level}
            </span>
            <span className="text-gray-500 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {lesson.category}
            </span>
            <span className="text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {lesson.estimated_read_time} min read
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{lesson.title}</h1>
          <p className="text-xl text-gray-600">{lesson.description}</p>
        </div>

        {/* Content */}
        <div className="bg-white border rounded-lg p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{
              __html: lesson.content
                .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
                .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
                .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4"><code>$2</code></pre>')
                .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1 py-0.5 rounded">$1</code>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                .replace(/- (.*$)/gm, '<li class="ml-4">$1</li>')
                .replace(/\n/g, '<br/>')
            }} />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {lesson.tags.map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
              #{tag}
            </span>
          ))}
        </div>

        {/* Related Challenges */}
        {relatedChallenges.length > 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Practice with Related Challenges</h3>
            <div className="space-y-3">
              {relatedChallenges.map(challenge => (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="flex items-center justify-between bg-white p-4 rounded-lg hover:shadow-md transition"
                >
                  <div>
                    <span className="font-medium">{challenge.title}</span>
                    <span className={`ml-3 px-2 py-1 rounded text-xs ${getDifficultyColor(challenge.difficulty_level || 1)}`}>
                      Level {challenge.difficulty_level || 1}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary-600" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Link
            href="/learn"
            className="flex items-center text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Lessons
          </Link>
          <Link
            href="/challenges"
            className="flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
          >
            Try Challenges
            <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
