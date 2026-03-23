-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Trigger to update updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Create challenges table
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  category text not null,
  points integer not null check (points > 0),
  time_limit_minutes integer not null check (time_limit_minutes > 0),
  test_cases jsonb not null default '[]',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for challenges
create index if not exists idx_challenges_active on public.challenges(is_active) where is_active = true;
create index if not exists idx_challenges_category on public.challenges(category);

alter table public.challenges enable row level security;

create policy "Challenges are viewable by everyone." on public.challenges for select using (true);

-- Create submissions table
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  code text not null,
  language text not null,
  status text not null check (status in ('pending', 'running', 'passed', 'failed', 'timeout', 'error')),
  score integer,
  passed_test_cases integer not null default 0,
  total_test_cases integer not null default 0,
  execution_time_ms integer,
  output text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for submissions
create index if not exists idx_submissions_user_challenge on public.submissions(user_id, challenge_id);
create index if not exists idx_submissions_created_at on public.submissions(created_at desc);

alter table public.submissions enable row level security;

create policy "Users can view own submissions." on public.submissions for select using (auth.uid() = user_id);
create policy "Users can insert own submissions." on public.submissions for insert with check (auth.uid() = user_id);
create policy "Users can update own submissions if pending." on public.submissions for update using (auth.uid() = user_id and status = 'pending');

-- Create scores table
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  points_earned integer not null check (points_earned >= 0),
  passed boolean not null default false,
  attempts integer not null default 1,
  best_time_ms integer check (best_time_ms > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_challenge unique (user_id, challenge_id)
);

-- Indexes for scores
create index if not exists idx_scores_user_id on public.scores(user_id);
create index if not exists idx_scores_points on public.scores(points_earned desc);

alter table public.scores enable row level security;

create policy "Scores are viewable by everyone." on public.scores for select using (true);

-- Create badges table
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  icon text not null,
  criteria jsonb not null default '{}',
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert default badges
insert into public.badges (id, name, description, icon, criteria, rarity, is_active) values
  (gen_random_uuid(), 'First Steps', 'Complete your first challenge', '👣', '{"type": "challenges_completed", "threshold": 1}', 'common', true),
  (gen_random_uuid(), 'Problem Solver', 'Complete 10 challenges', '🧩', '{"type": "challenges_completed", "threshold": 10}', 'rare', true),
  (gen_random_uuid(), 'Speed Demon', 'Solve a challenge in under 30 seconds', '⚡', '{"type": "speedrun", "threshold": 30}', 'rare', true),
  (gen_random_uuid(), 'Master', 'Earn 1000 points', '🏆', '{"type": "points_total", "threshold": 1000}', 'epic', true),
  (gen_random_uuid(), 'Legend', 'Earn 5000 points', '🌟', '{"type": "points_total", "threshold": 5000}', 'legendary', true)
on conflict do nothing;

alter table public.badges enable row level security;
create policy "Badges are viewable by everyone." on public.badges for select using (true);

-- Create user_badges table
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  constraint unique_user_badge unique (user_id, badge_id)
);

-- Index for user_badges
create index if not exists idx_user_badges_user_id on public.user_badges(user_id);

alter table public.user_badges enable row level security;
create policy "User badges are viewable by everyone." on public.user_badges for select using (true);

-- Function to auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users to create profile after signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to award badge when criteria met (to be called by scoring logic)
create or replace function public.award_badge(p_user_id uuid, p_badge_criteria jsonb)
returns void as $$
begin
  if not exists (
    select 1 from public.user_badges ub
    join public.badges b on ub.badge_id = b.id
    where ub.user_id = p_user_id and b.criteria = p_badge_criteria
  ) then
    insert into public.user_badges (user_id, badge_id)
    select p_user_id, b.id
    from public.badges b
    where b.criteria = p_badge_criteria and b.is_active;
  end if;
end;
$$ language plpgsql security definer;

-- Add comments
comment on table public.profiles is 'User profile information.';
comment on table public.challenges is 'Coding challenges.';
comment on table public.submissions is 'User code submissions.';
comment on table public.scores is 'User scores per challenge.';
comment on table public.badges is 'Badge definitions.';
comment on table public.user_badges is 'User earned badges.';
