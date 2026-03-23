'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import CodeEditor from './CodeEditor';
import { BookOpen, Clock, Database, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface Solution {
  id: string;
  code: string;
  explanation: string;
  time_complexity: string;
  space_complexity: string;
  hints: string[];
  language: string;
}

interface SolutionPanelProps {
  challengeId: string;
  userCode: string;
  userLanguage: string;
  passed: boolean;
}

export default function SolutionPanel({ challengeId, userCode, userLanguage, passed }: SolutionPanelProps) {
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [activeTab, setActiveTab] = useState<'solution' | 'explanation' | 'comparison'>('explanation');

  useEffect(() => {
    const fetchSolution = async () => {
      const { data } = await supabase
        .from('solutions')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('language', userLanguage)
        .single();

      if (data) setSolution(data);
      setLoading(false);
    };
    fetchSolution();
  }, [challengeId, userLanguage]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Solution explanation not available for this challenge yet.</p>
      </div>
    );
  }

  const TabButton = ({ id, label, active }: { id: string; label: string; active: boolean }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`px-4 py-2 font-medium text-sm transition ${
        active
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary-50 to-primary-100">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          {passed ? '🎉 Great Job!' : '💡 Learn from the Solution'}
        </h3>

        {/* Complexity Badges */}
        <div className="flex gap-3 mt-3">
          <span className="inline-flex items-center gap-1 text-xs bg-white px-3 py-1 rounded-full shadow-sm">
            <Clock className="w-3 h-3" /> Time: {solution.time_complexity}
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-white px-3 py-1 rounded-full shadow-sm">
            <Database className="w-3 h-3" /> Space: {solution.space_complexity}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <TabButton id="explanation" label="Explanation" active={activeTab === 'explanation'} />
        <TabButton id="solution" label="Optimal Solution" active={activeTab === 'solution'} />
        {!passed && <TabButton id="comparison" label="Your vs Optimal" active={activeTab === 'comparison'} />}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'explanation' && (
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{solution.explanation}</p>

            {/* Hints Section */}
            {solution.hints && solution.hints.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="flex items-center gap-2 text-primary-600 font-medium hover:underline"
                >
                  <Lightbulb className="w-4 h-4" />
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                  {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHints && (
                  <ul className="mt-3 space-y-2">
                    {solution.hints.map((hint, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                        <span className="text-yellow-500">💡</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'solution' && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Optimal {solution.language} solution:</p>
            <CodeEditor
              code={solution.code}
              setCode={() => {}}
              language={solution.language}
              height="300px"
              readOnly={true}
            />
          </div>
        )}

        {activeTab === 'comparison' && !passed && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Your Solution:</h4>
              <CodeEditor
                code={userCode}
                setCode={() => {}}
                language={userLanguage}
                height="200px"
                readOnly={true}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-1">Optimal Solution:</h4>
              <CodeEditor
                code={solution.code}
                setCode={() => {}}
                language={solution.language}
                height="200px"
                readOnly={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
