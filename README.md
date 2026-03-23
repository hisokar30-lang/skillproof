# SkillProof

SkillProof is a platform for skill verification through short, timed coding challenges. Users can choose challenges, write code, earn points, and collect badges.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel (recommended)

## Getting Started

### 1. Clone and install

\`\`\`bash
npm install
\`\`\`

### 2. Set up Supabase

1. Create a project at [Supabase](https://supabase.com)
2. Go to Database > Migrations and apply the migration in \`supabase/migrations/001_initial_schema.sql\`
3. Alternatively, you can run the SQL manually in the Supabase SQL editor.
4. Get your Supabase URL and anon key from Project Settings > API

### 3. Configure environment

Copy \`.env.local.example\` to \`.env.local\` and fill in your Supabase credentials:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Run the development server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- User registration and authentication (via Supabase Auth)
- Browse coding challenges by category and difficulty
- Submit code solutions (supports Python, JavaScript, TypeScript)
- Real-time judging with test cases
- Score tracking and leaderboards
- Badge awards for achievements
- User profiles with stats

## Project Structure

- \`/src/app\` - Next.js App Router pages
- \`/src/components\` - Reusable React components
- \`/src/hooks\` - Custom React hooks (useAuth)
- \`/src/lib\` - Utility libraries (Supabase client)
- \`/src/types\` - TypeScript type definitions
- \`/supabase/migrations\` - Database schema

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

Make sure to add the Supabase environment variables in Vercel project settings.

## License

MIT
