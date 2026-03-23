import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const JUDGE0_API = 'https://api.judge0.com';

const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  javascript: 63,
  typescript: 74,
};

export async function POST(req: NextRequest) {
  try {
    const { submission_id, code, language, test_cases } = await req.json();

    if (!submission_id || !code || !language || !test_cases) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    // Run each test case
    const results = [];
    let allPassed = true;
    let totalTime = 0;

    for (const testCase of test_cases) {
      const input = testCase.input;
      const expectedOutput = String(testCase.expected_output).trim();

      const response = await fetch(`${JUDGE0_API}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: code,
          stdin: input,
        }),
      });

      const data = await response.json();

      if (data.token) {
        // Poll for result
        let result;
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const pollRes = await fetch(`${JUDGE0_API}/submissions/${data.token}`);
          result = await pollRes.json();
          if (result.status.id >= 3) break;
        }

        const actualOutput = (result.stdout || '').trim();
        const passed = actualOutput === expectedOutput;

        results.push({
          input,
          expected: expectedOutput,
          actual: actualOutput,
          passed,
          time: result.time,
          error: result.stderr || result.compile_output || result.message,
        });

        if (!passed) allPassed = false;
        totalTime += parseFloat(result.time || 0);
      }
    }

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = test_cases.length;

    // Calculate score percentage
    const score = Math.round((passedCount / totalCount) * 100);
    const status = allPassed ? 'passed' : 'failed';

    // Update submission in database
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status,
        score,
        passed_test_cases: passedCount,
        total_test_cases: totalCount,
        execution_time_ms: Math.round(totalTime * 1000),
        output: JSON.stringify(results),
      })
      .eq('id', submission_id);

    if (updateError) {
      console.error('Failed to update submission:', updateError);
    }

    // Update or insert score record
    const { data: submission } = await supabase
      .from('submissions')
      .select('challenge_id, user_id')
      .eq('id', submission_id)
      .single();

    if (submission) {
      const { data: existingScore } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', submission.user_id)
        .eq('challenge_id', submission.challenge_id)
        .single();

      if (existingScore) {
        // Update if better score
        if (score > existingScore.points_earned || (score === 100 && !existingScore.passed)) {
          await supabase
            .from('scores')
            .update({
              points_earned: Math.max(score, existingScore.points_earned),
              passed: allPassed || existingScore.passed,
              attempts: existingScore.attempts + 1,
              best_time_ms: existingScore.best_time_ms
                ? Math.min(existingScore.best_time_ms, Math.round(totalTime * 1000))
                : Math.round(totalTime * 1000),
            })
            .eq('id', existingScore.id);
        } else {
          // Just increment attempts
          await supabase
            .from('scores')
            .update({ attempts: existingScore.attempts + 1 })
            .eq('id', existingScore.id);
        }
      } else {
        // Get challenge points
        const { data: challenge } = await supabase
          .from('challenges')
          .select('points')
          .eq('id', submission.challenge_id)
          .single();

        await supabase.from('scores').insert({
          user_id: submission.user_id,
          challenge_id: submission.challenge_id,
          points_earned: allPassed && challenge ? challenge.points : 0,
          passed: allPassed,
          attempts: 1,
          best_time_ms: Math.round(totalTime * 1000),
        });
      }

      // Check and award badges
      await checkAndAwardBadges(submission.user_id);
    }

    return NextResponse.json({
      status,
      score,
      passed_test_cases: passedCount,
      total_test_cases: totalCount,
      results,
    });
  } catch (error) {
    console.error('Judge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkAndAwardBadges(userId: string) {
  // Get user's stats
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId);

  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true);

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
  const userBadgesToInsert = [];

  const totalPoints = scores?.reduce((sum, s) => sum + s.points_earned, 0) || 0;
  const completedChallenges = scores?.filter(s => s.passed).length || 0;
  const bestTime = scores?.reduce((min, s) => Math.min(min, s.best_time_ms || Infinity), Infinity) || Infinity;

  for (const badge of badges || []) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const criteria = badge.criteria;
    let earned = false;

    switch (criteria.type) {
      case 'challenges_completed':
        earned = completedChallenges >= criteria.threshold;
        break;
      case 'points_total':
        earned = totalPoints >= criteria.threshold;
        break;
      case 'speedrun':
        earned = bestTime < criteria.threshold * 1000; // threshold in seconds
        break;
    }

    if (earned) {
      userBadgesToInsert.push({
        user_id: userId,
        badge_id: badge.id,
      });
    }
  }

  if (userBadgesToInsert.length > 0) {
    await supabase.from('user_badges').insert(userBadgesToInsert);
  }
}
