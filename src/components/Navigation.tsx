'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { getSupabaseClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user ?? null);
          }
        );

        setLoading(false);

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth init error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogout = async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            SkillProof
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/learn" className="text-gray-600 hover:text-primary-600">
              Learn
            </Link>
            <Link href="/challenges" className="text-gray-600 hover:text-primary-600">
              Challenges
            </Link>
            <Link href="/progress" className="text-gray-600 hover:text-primary-600">
              Progress
            </Link>
            <Link href="/leaderboard" className="text-gray-600 hover:text-primary-600">
              Leaderboard
            </Link>
            {!loading && (user ? (
              <>
                <Link href="/subscription" className="text-gray-600 hover:text-primary-600">
                  Subscription
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-primary-600">
                  Profile
                </Link>
                <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-primary-600">
                  Login
                </Link>
                <Link href="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                  Sign Up
                </Link>
              </>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
