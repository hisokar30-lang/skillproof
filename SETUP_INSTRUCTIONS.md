# SkillProof Setup Instructions

The project skeleton is complete. Follow these steps to get the database ready:

## 1. Apply Database Migration

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project (jxcfzepvfyrypcncsryi)
3. In the left menu, click **Database** → **SQL Editor**
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the SQL Editor and click **Run** (or press Ctrl+Enter)
6. Wait for the query to complete successfully.

This creates all necessary tables: `profiles`, `challenges`, `submissions`, `scores`, `badges`, `user_badges`, plus RLS policies and triggers.

## 2. Install Dependencies

In the project directory:

```bash
npm install
```

## 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. Test the Application

- Register a new account at `/register`
- Browse challenges at `/challenges`
- View your profile at `/profile`
- Submit code solutions (Python, JavaScript, TypeScript)

## Notes

- The provided `sbp_5b64dd2f8a16668a52eee835fcda52a7c4c17613` is used as the `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If you encounter authentication errors, replace it with the anon key from your Supabase project settings (Project Settings → API → anon public key).
- The database migration sets up Row Level Security (RLS) policies. Ensure your anon key has the appropriate permissions (which it does by default).
- All user data (profiles, submissions, scores) will be stored in your Supabase database.

Enjoy building SkillProof!
