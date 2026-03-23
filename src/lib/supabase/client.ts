import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
        }
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          category: string
          points: number
          time_limit_minutes: number
          test_cases: any // JSONB
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          category: string
          points: number
          time_limit_minutes: number
          test_cases: any
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          category?: string
          points?: number
          time_limit_minutes?: number
          test_cases?: any
          is_active?: boolean
        }
      }
      submissions: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          code: string
          language: string
          status: 'pending' | 'running' | 'passed' | 'failed' | 'timeout' | 'error'
          score: number | null
          passed_test_cases: number
          total_test_cases: number
          execution_time_ms: number | null
          output: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          code: string
          language: string
          status?: 'pending' | 'running' | 'passed' | 'failed' | 'timeout' | 'error'
          score?: number | null
          passed_test_cases?: number
          total_test_cases?: number
          execution_time_ms?: number | null
          output?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          code?: string
          language?: string
          status?: 'pending' | 'running' | 'passed' | 'failed' | 'timeout' | 'error'
          score?: number | null
          passed_test_cases?: number
          total_test_cases?: number
          execution_time_ms?: number | null
          output?: string | null
          error_message?: string | null
        }
      }
      scores: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          points_earned: number
          passed: boolean
          attempts: number
          best_time_ms: number | null
          created_at: string
          updated_at: string
          unique_user_challenge: string // generated constraint
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          points_earned: number
          passed: boolean
          attempts: number
          best_time_ms?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          points_earned?: number
          passed?: boolean
          attempts?: number
          best_time_ms?: number | null
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          criteria: any // JSONB
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          criteria: any
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          criteria?: any
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
          is_active?: boolean
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
    }
  }
}
