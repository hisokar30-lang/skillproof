export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  points: number;
  time_limit_minutes: number;
  test_cases: TestCase[];
  is_active: boolean;
  created_at: string;
}

export interface TestCase {
  input: any;
  expected_output: any;
  hidden?: boolean;
}

export interface Submission {
  id: string;
  challenge_id: string;
  user_id: string;
  code: string;
  language: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'timeout' | 'error';
  score: number | null;
  passed_test_cases: number;
  total_test_cases: number;
  execution_time_ms: number | null;
  output: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Score {
  id: string;
  user_id: string;
  challenge_id: string;
  points_earned: number;
  passed: boolean;
  attempts: number;
  best_time_ms: number | null;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
}

export interface BadgeCriteria {
  type: 'points_total' | 'challenges_completed' | 'streak' | 'category_master' | 'speedrun';
  threshold: number;
  category?: string;
  days?: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
  total_points: number;
  challenges_completed: number;
  badges: UserBadge[];
  is_public?: boolean;
}
