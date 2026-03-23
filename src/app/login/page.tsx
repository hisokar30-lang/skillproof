'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Shield, ShieldCheck, ArrowLeft, Lock } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | '2fa' | 'success'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1: Authenticate with password
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      // Step 2: Check if 2FA is enabled
      const res = await fetch(`/api/auth/2fa?userId=${data.user.id}`);
      const twoFactorStatus = await res.json();

      if (twoFactorStatus.enabled) {
        // Need 2FA verification
        setUserId(data.user.id);
        setStep('2fa');
        setLoading(false);
      } else {
        // No 2FA, login complete
        setStep('success');
        setTimeout(() => router.push('/'), 1000);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'verify_login',
          token: twoFactorCode,
        }),
      });

      if (!res.ok) {
        const { error: verifyError } = await res.json();
        throw new Error(verifyError || 'Invalid code');
      }

      setStep('success');
      setTimeout(() => router.push('/'), 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('credentials');
    setTwoFactorCode('');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto py-12">
      {/* Progress indicator */}
      {step === '2fa' && (
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      )}

      {step === 'credentials' ? (
        <>
          <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-center mb-6">Sign in to your SkillProof account</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </>
      ) : step === '2fa' ? (
        <>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-500">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handle2FAVerify} className="space-y-4">
            <div>
              <label htmlFor="2fa-code" className="block text-sm font-medium text-gray-700">
                Authentication Code
              </label>
              <input
                id="2fa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="000 000"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                You can also use a backup code
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || twoFactorCode.length !== 6}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">
                <strong>Lost access to your authenticator?</strong>
                <br />
                Use one of your saved backup codes instead.
              </p>
            </div>
          </div>
        </>
      ) : (
        /* Success state */
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-gray-500">Redirecting you to SkillProof...</p>
        </div>
      )}
    </div>
  );
}
