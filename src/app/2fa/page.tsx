'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Shield, ShieldCheck, ShieldAlert, Copy, CheckCircle, AlertTriangle, RefreshCw, Smartphone, Key } from 'lucide-react';
// @ts-ignore - QRCode doesn't have types but works
import QRCode from 'qrcode';

interface TwoFAStatus {
  enabled: boolean;
  enrolled: boolean;
  created_at: string | null;
  last_used_at: string | null;
}

interface SetupState {
  step: 'initial' | 'scan' | 'verify' | 'complete' | 'disable';
  secret: string;
  totpUri: string;
  qrCodeUrl: string;
  backupCodes: string[];
  error: string;
  loading: boolean;
}

export default function TwoFAPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [setup, setSetup] = useState<SetupState>({
    step: 'initial',
    secret: '',
    totpUri: '',
    qrCodeUrl: '',
    backupCodes: [],
    error: '',
    loading: false,
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStatus();
    }
  }, [user]);

  const fetchStatus = async () => {
    const res = await fetch(`/api/auth/2fa?userId=${user?.id}`);
    if (res.ok) {
      const data = await res.json();
      setStatus(data);
    }
  };

  const startSetup = async () => {
    setSetup(s => ({ ...s, loading: true, error: '' }));

    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'setup' }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      const { secret, totpUri, backupCodes } = await res.json();

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(totpUri);

      setSetup({
        step: 'scan',
        secret,
        totpUri,
        qrCodeUrl,
        backupCodes,
        error: '',
        loading: false,
      });
    } catch (err: any) {
      setSetup(s => ({ ...s, error: err.message, loading: false }));
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setSetup(s => ({ ...s, error: 'Please enter a valid 6-digit code' }));
      return;
    }

    setSetup(s => ({ ...s, loading: true, error: '' }));

    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action: 'verify',
          token: verificationCode,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      setSetup(s => ({ ...s, step: 'complete', loading: false }));
      await fetchStatus();
    } catch (err: any) {
      setSetup(s => ({ ...s, error: err.message, loading: false }));
    }
  };

  const disable2FA = async () => {
    if (!disableCode) {
      setSetup(s => ({ ...s, error: 'Please enter your 2FA code or backup code' }));
      return;
    }

    setSetup(s => ({ ...s, loading: true, error: '' }));

    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          action: 'disable',
          token: disableCode,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      setSetup(s => ({ ...s, step: 'initial', loading: false }));
      setDisableCode('');
      await fetchStatus();
    } catch (err: any) {
      setSetup(s => ({ ...s, error: err.message, loading: false }));
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const getInitials = (email: string) => {
    return email?.charAt(0).toUpperCase() || 'U';
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Two-Factor Authentication</h1>
        <p className="text-gray-600 mb-6">Please log in to manage your security settings.</p>
        <Link href="/login" className="text-primary-600 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          {status?.enabled ? (
            <ShieldCheck className="w-8 h-8 text-green-500" />
          ) : (
            <Shield className="w-8 h-8 text-gray-400" />
          )}
          Two-Factor Authentication
        </h1>
        <p className="text-gray-600">
          Add an extra layer of security to your account by enabling 2FA.
        </p>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl p-6 mb-8 ${
        status?.enabled ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            status?.enabled ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {status?.enabled ? (
              <ShieldCheck className="w-6 h-6 text-green-600" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div>
            <h2 className={`font-semibold ${
              status?.enabled ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {status?.enabled ? '2FA is Enabled' : '2FA is Not Enabled'}
            </h2>
            <p className={`text-sm ${
              status?.enabled ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {status?.enabled
                ? `Last used: ${status.last_used_at ? new Date(status.last_used_at).toLocaleDateString() : 'Never'}`
                : 'Your account is protected by password only'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!status?.enabled ? (
        <>
          {setup.step === 'initial' && (
            <div className="bg-white border rounded-xl p-8 text-center">
              <Smartphone className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Set Up 2FA</h3>
              <p className="text-gray-600 mb-6">
                Use an authenticator app like Google Authenticator, Authy, or 1Password
                to generate one-time codes.
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Scan a QR code with your app
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Save your backup codes securely
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Enter a 6-digit code to verify
                </li>
              </ul>
              <button
                onClick={startSetup}
                disabled={setup.loading}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {setup.loading ? 'Setting up...' : 'Enable 2FA'}
              </button>
              {setup.error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {setup.error}
                </div>
              )}
            </div>
          )}

          {setup.step === 'scan' && (
            <div className="bg-white border rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Scan QR Code</h3>
                <span className="text-sm text-gray-500">Step 1 of 2</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <img src={setup.qrCodeUrl} alt="QR Code" className="mx-auto" />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Can't scan? Enter this code manually:</p>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1 font-mono">
                    {setup.secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(setup.secret, 'code')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    {copiedCode ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit code from your app
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border rounded-lg px-4 py-3 text-center text-2xl tracking-widest"
                  placeholder="000 000"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSetup(s => ({ ...s, step: 'initial' }))}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={verifySetup}
                  disabled={setup.loading || verificationCode.length !== 6}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {setup.loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              {setup.error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                  {setup.error}
                </div>
              )}
            </div>
          )}

          {setup.step === 'complete' && (
            <div className="bg-white border rounded-xl p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">2FA Enabled!</h3>
              <p className="text-gray-600 mb-6">
                Your account is now secured with two-factor authentication.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Important: Save Your Backup Codes</span>
                </div>
                <p className="text-sm text-yellow-700 mb-4">
                  If you lose your phone, these codes are the only way to access your account.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {setup.backupCodes.map((code, i) => (
                    <code key={i} className="bg-white px-2 py-1 rounded text-sm font-mono">
                      {code}
                    </code>
                  ))}
                </div>
                <button
                  onClick={() => copyToClipboard(setup.backupCodes.join('\n'), 'backup')}
                  className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {copiedBackup ? 'Copied!' : 'Copy all codes'}
                </button>
              </div>

              <button
                onClick={() => {
                  setSetup(s => ({ ...s, step: 'initial' }));
                  setVerificationCode('');
                }}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition"
              >
                Done
              </button>
            </div>
          )}
        </>
      ) : (
        /* Disable 2FA */
        <div className="bg-white border rounded-xl p-8">
          {setup.step === 'disable' ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-red-600">Disable 2FA</h3>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">
                  This will remove an extra layer of security from your account.
                  You'll need to enter your current 2FA code to confirm.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 2FA code or backup code
                </label>
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                  placeholder="000000 or backup code"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSetup(s => ({ ...s, step: 'initial', error: '' }))}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={disable2FA}
                  disabled={setup.loading || !disableCode}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {setup.loading ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>

              {setup.error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                  {setup.error}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Key className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Authentication Method</h3>
                  <p className="text-sm text-gray-500">Time-based One-Time Password (TOTP)</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Enrolled on</p>
                    <p className="font-medium">
                      {status?.created_at ? new Date(status.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Last used</p>
                    <p className="font-medium">
                      {status?.last_used_at
                        ? new Date(status.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSetup(s => ({ ...s, step: 'disable' }))}
                  className="w-full border border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 transition"
                >
                  Disable 2FA
                </button>
                <button
                  onClick={startSetup}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Regenerate Backup Codes
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
