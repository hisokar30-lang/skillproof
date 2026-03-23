'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function HeroCTA() {
  const { user, loading } = useAuth();

  // Show skeleton during SSR/hydration
  if (loading) {
    return (
      <div className="space-x-4">
        <div className="inline-block bg-gray-200 text-transparent px-6 py-3 rounded-lg font-semibold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-x-4">
      {user ? (
        <>
          <Link
            href="/challenges"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Start Coding
          </Link>
          <Link
            href="/profile"
            className="border border-primary-600 text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
          >
            View Profile
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/register"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/challenges"
            className="border border-primary-600 text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
          >
            Browse Challenges
          </Link>
        </>
      )}
    </div>
  );
}
