'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { Challenge, Submission } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useUsage } from '@/hooks/useUsage';
import { Clock, Timer, AlertCircle } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import SolutionPanel from '@/components/SolutionPanel';

interface ExtendedChallenge extends Challenge {
  difficulty_level?: number;
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { canSubmit, remainingAttempts, isPremium, FREE_TIER_LIMIT, loading: usageLoading } = useUsage();
  const [challenge, setChallenge] = useState<ExtendedChallenge | null>(null);
  const [code, setCode] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error'|'warning', text: string} | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{passed: boolean, score: number} | null>(null);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Fetch challenge
  useEffect(() => {
    if (!id) return;
    const fetchChallenge = async () => {
      const { data } = await supabase.from('challenges').select('*').eq('id', id).single();
      if (data) {
        setChallenge(data);
        // Set timer when challenge loads
        if (data.time_limit_minutes) {
          setTimeRemaining(data.time_limit_minutes * 60); // Convert to seconds
          setTimerActive(true);
          setStartTime(Date.now());
        }
      }
    };
    fetchChallenge();
  }, [id]);

  // Fetch submissions
  useEffect(() => {
    if (!id || !user) return;
    const fetchSubmissions = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('challenge_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setSubmissions(data);
    };
    fetchSubmissions();
  }, [id, user]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const handleTimeUp = useCallback(async () => {
    setTimerActive(false);
    setMessage({ type: 'warning', text: '⏰ Time\'s up! Submitting your code...' });

    // If there's code, submit it
    if (code.trim() && user && challenge) {
      await submitCode(true);
    } else {
      setMessage({ type: 'error', text: '⏰ Time\'s up! No code was submitted.' });
    }
  }, [code, user, challenge]);

  const submitCode = async (isAutoSubmit: boolean = false) => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to submit.' });
      return;
    }
    if (!canSubmit && !isPremium) {
      setMessage({ type: 'error', text: 'Free tier limit reached. Upgrade for unlimited.' });
      return;
    }

    setSubmitting(true);
    setSubmittedCode(code); // Save submitted code for comparison
    setMessage({ type: 'success', text: isAutoSubmit ? '⏰ Auto-submitting...' : 'Running tests... Please wait.' });

    // Calculate execution time
    const executionTime = startTime ? Date.now() - startTime : 0;

    const { data: newSubmission, error } = await supabase.from('submissions').insert({
      challenge_id: id,
      user_id: user.id,
      code,
      language,
      status: 'running',
      passed_test_cases: 0,
      total_test_cases: challenge?.test_cases?.length || 0,
    }).select('id').single();

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setSubmitting(false);
      return;
    }

    // Trigger judging
    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: newSubmission.id,
          code,
          language,
          test_cases: challenge?.test_cases?.filter((tc: any) => !tc.hidden) || [],
          execution_time_ms: executionTime,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setMessage({
          type: result.status === 'passed' ? 'success' : 'error',
          text: `${result.status === 'passed' ? '✅' : '❌'} ${result.passed_test_cases}/${result.total_test_cases} tests passed! Score: ${result.score}%`
        });
        // Save result and show solution
        setLastSubmissionResult({ passed: result.status === 'passed', score: result.score });
        setShowSolution(true);
        // Stop timer on successful submission
        setTimerActive(false);
      } else {
        setMessage({ type: 'error', text: 'Judge error occurred. Refresh to see results.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to run tests. Refresh to see results.' });
    }

    setCode('');
    setSubmitting(false);

    // Refresh submissions
    const { data } = await supabase.from('submissions').select('*').eq('challenge_id', id).eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setSubmissions(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCode(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining > 300) return 'text-green-600 bg-green-50 border-green-200'; // > 5 min
    if (timeRemaining > 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'; // > 1 min
    return 'text-red-600 bg-red-50 border-red-200 animate-pulse'; // < 1 min
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800';
    if (difficulty <= 3) return 'bg-green-100 text-green-800';
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!challenge) return <div className="container mx-auto py-12">Challenge not found.</div>;

  const difficultyLevel = challenge.difficulty_level || (challenge.difficulty === 'beginner' ? 1 : challenge.difficulty === 'intermediate' ? 5 : 8);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/challenges" className="text-primary-600 hover:underline mb-4 inline-block">
        &larr; Back to Challenges
      </Link>

      {/* Timer Banner */}
      {timerActive && (
        <div className={`mb-6 p-4 rounded-lg border ${getTimerColor()} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Timer className="w-6 h-6" />
            <div>
              <span className="text-2xl font-bold font-mono">{formatTime(timeRemaining)}</span>
              <span className="ml-2 text-sm opacity-75">remaining</span>
            </div>
          </div>
          <div className="text-sm">
            Time Limit: {challenge.time_limit_minutes} minutes
          </div>
        </div>
      )}

      {/* Time Up Warning */}
      {!timerActive && timeRemaining === 0 && startTime && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <span className="font-medium">Time is up! You can no longer submit for this attempt.</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold mb-4">{challenge.title}</h1>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(difficultyLevel)}`}>
              Level {difficultyLevel}
            </span>
            <span className="text-gray-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {challenge.time_limit_minutes} min
            </span>
            <span className="text-gray-600">{challenge.category}</span>
            <span className="text-gray-600">{challenge.points} points</span>
          </div>
          <div className="prose max-w-none mb-8">
            <h2 className="text-2xl font-semibold mb-2">Description</h2>
            <p className="whitespace-pre-line">{challenge.description}</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4">Test Cases</h2>
            <ul className="space-y-4">
              {challenge.test_cases?.map((tc: any, idx: number) => (
                <li key={idx} className="border-b pb-4 last:border-0">
                  <p><strong>Input:</strong> <code className="bg-gray-200 px-2 py-1 rounded text-sm">{JSON.stringify(tc.input)}</code></p>
                  <p><strong>Expected Output:</strong> <code className="bg-gray-200 px-2 py-1 rounded text-sm">{JSON.stringify(tc.expected_output)}</code></p>
                  {tc.hidden && <span className="text-sm text-gray-500"> (hidden)</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="sticky top-8 border rounded-lg p-6 bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Submit Solution</h3>
            {!user ? (
              <p className="text-gray-600 mb-4">Please <Link href="/login" className="text-primary-600">login</Link> to submit.</p>
            ) : (
              <>
                {/* Free Tier Warning */}
                {!isPremium && !usageLoading && (
                  <div className={`mb-4 p-3 rounded ${remainingAttempts === 0 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-sm ${remainingAttempts === 0 ? 'text-red-800' : 'text-blue-800'}`}>
                      <strong>Free Tier:</strong> {remainingAttempts}/{FREE_TIER_LIMIT} attempts remaining this month.
                      {remainingAttempts === 0 && (
                        <>
                          <br />
                          <Link href="#pricing" className="text-primary-600 hover:underline font-medium">
                            Upgrade to Premium for unlimited
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Timer warning if running low */}
                {timerActive && timeRemaining <= 60 && timeRemaining > 0 && (
                  <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
                    <strong>⚠️ Hurry!</strong> Less than a minute remaining!
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      disabled={!timerActive && timeRemaining === 0}
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                    <CodeEditor
                      code={code}
                      setCode={setCode}
                      language={language}
                      height="300px"
                      readOnly={!timerActive && timeRemaining === 0}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !code.trim() || (!canSubmit && !isPremium) || (!timerActive && timeRemaining === 0)}
                    className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? 'Submitting...' :
                     !timerActive && timeRemaining === 0 ? 'Time Expired' :
                     !canSubmit && !isPremium ? 'Free Limit Reached' :
                     `Submit Code${timeRemaining > 0 ? ` (${formatTime(timeRemaining)} left)` : ''}`}
                  </button>
                </form>
              </>
            )}
            {message && (
              <div className={`mt-4 p-3 rounded ${
                message.type === 'error' ? 'bg-red-100 text-red-700' :
                message.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {message.text}
              </div>
            )}

            {user && submissions.length > 0 && (
              <div className="mt-8">
                <h4 className="font-semibold mb-2">Your Submissions</h4>
                <ul className="space-y-2">
                  {submissions.map(sub => (
                    <li key={sub.id} className="text-sm border-b pb-2">
                      <span className={`inline-block w-20 px-2 py-0.5 rounded text-xs font-semibold ${
                        sub.status === 'passed' ? 'bg-green-100 text-green-800' :
                        sub.status === 'failed' ? 'bg-red-100 text-red-800' :
                        sub.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sub.status}
                      </span>
                      <span className="ml-2">{new Date(sub.created_at).toLocaleTimeString()}</span>
                      {sub.score !== null && <span className="float-right">{sub.score} pts</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Solution Panel */}
            {showSolution && challenge && lastSubmissionResult && (
              <div className="mt-8">
                <SolutionPanel
                  challengeId={challenge.id}
                  userCode={submittedCode}
                  userLanguage={language}
                  passed={lastSubmissionResult.passed}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
