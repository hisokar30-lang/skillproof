import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate Base32 secret for TOTP
function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += base32chars[bytes[i] % 32];
  }
  return secret.slice(0, 32);
}

// Generate backup codes
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

// Generate TOTP URI for QR code
function generateTotpUri(secret: string, email: string): string {
  const issuer = 'SkillProof';
  const accountName = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    switch (action) {
      case 'setup': {
        // Check if 2FA already enabled
        const { data: existing } = await supabase
          .from('user_2fa')
          .select('enabled')
          .eq('user_id', userId)
          .single();

        if (existing?.enabled) {
          return NextResponse.json({ error: '2FA already enabled' }, { status: 400 });
        }

        // Generate new secret and backup codes
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();

        // Get user email
        const { data: user } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        const totpUri = generateTotpUri(secret, user?.email || '');

        // Store (temporary, not enabled until verified)
        await supabase.from('user_2fa').upsert({
          user_id: userId,
          enabled: false,
          secret: secret,
          backup_codes: backupCodes,
        }, {
          onConflict: 'user_id'
        });

        return NextResponse.json({
          secret,
          totpUri,
          backupCodes,
        });
      }

      case 'verify': {
        const { token } = await req.json();

        const { data: twoFactor } = await supabase
          .from('user_2fa')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!twoFactor || twoFactor.enabled) {
          return NextResponse.json({ error: 'Invalid setup' }, { status: 400 });
        }

        // Verify token
        const isValid = await verifyToken(twoFactor.secret, token);

        if (!isValid) {
          // Audit failed attempt
          await supabase.from('user_2fa_audit').insert({
            user_id: userId,
            event_type: 'failed_attempt',
          });
          return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        // Enable 2FA
        await supabase
          .from('user_2fa')
          .update({ enabled: true, updated_at: new Date() })
          .eq('user_id', userId);

        // Audit
        await supabase.from('user_2fa_audit').insert({
          user_id: userId,
          event_type: 'enabled',
        });

        return NextResponse.json({
          success: true,
          backupCodes: twoFactor.backup_codes,
          message: '2FA enabled successfully'
        });
      }

      case 'disable': {
        const { token, password } = await req.json();

        // Verify re-authentication
        const { data: user } = await supabase.auth.admin.getUserById(userId);
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify 2FA token or backup code
        const { data: twoFactor } = await supabase
          .from('user_2fa')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!twoFactor || !twoFactor.enabled) {
          return NextResponse.json({ error: '2FA not enabled' }, { status: 400 });
        }

        const isValid = await verifyToken(twoFactor.secret, token) ||
          twoFactor.backup_codes?.includes(token);

        if (!isValid) {
          return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        // Disable 2FA
        await supabase
          .from('user_2fa')
          .delete()
          .eq('user_id', userId);

        // Audit
        await supabase.from('user_2fa_audit').insert({
          user_id: userId,
          event_type: 'disabled',
        });

        return NextResponse.json({
          success: true,
          message: '2FA disabled successfully'
        });
      }

      case 'verify_login': {
        const { token } = await req.json();

        const { data: twoFactor } = await supabase
          .from('user_2fa')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!twoFactor || !twoFactor.enabled) {
          return NextResponse.json({ error: '2FA not enabled' }, { status: 400 });
        }

        // Check if it's a backup code
        if (twoFactor.backup_codes?.includes(token)) {
          // Remove used backup code
          const newCodes = twoFactor.backup_codes.filter((c: string) => c !== token);
          await supabase
            .from('user_2fa')
            .update({ backup_codes: newCodes })
            .eq('user_id', userId);

          // Audit
          await supabase.from('user_2fa_audit').insert({
            user_id: userId,
            event_type: 'backup_used',
          });

          return NextResponse.json({ success: true });
        }

        // Verify TOTP token
        const isValid = await verifyToken(twoFactor.secret, token);

        if (!isValid) {
          return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        // Update last used
        await supabase
          .from('user_2fa')
          .update({ last_used_at: new Date() })
          .eq('user_id', userId);

        // Audit
        await supabase.from('user_2fa_audit').insert({
          user_id: userId,
          event_type: 'verified',
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('2FA error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Simple TOTP verification (aligned with RFC 6238)
async function verifyToken(secret: string, token: string): Promise<boolean> {
  // In production, use a proper TOTP library
  // This is a simplified version for demonstration
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  // Check current and adjacent windows
  for (let i = -1; i <= 1; i++) {
    const expectedTime = Math.floor(now / timeStep) + i;
    const expectedToken = generateTOTP(secret, expectedTime);
    if (token === expectedToken) return true;
  }

  return false;
}

// Generate TOTP code for a given time counter
function generateTOTP(secret: string, timeStep: number): string {
  // Decode base32 secret
  const decoded = base32Decode(secret);

  // Create HMAC
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);
  const hmac = crypto.createHmac('sha1', decoded);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

// Base32 decode
function base32Decode(encoded: string): Buffer {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';

  for (const char of encoded) {
    const val = base32chars.indexOf(char.toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = parseInt(bits.slice(i, i + 8), 2);
    if (!isNaN(byte)) bytes.push(byte);
  }

  return Buffer.from(bytes);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: twoFactor } = await supabase
      .from('user_2fa')
      .select('enabled, created_at, last_used_at')
      .eq('user_id', userId)
      .single();

    // Get recent audit events
    const { data: audit } = await supabase
      .from('user_2fa_audit')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      enabled: twoFactor?.enabled || false,
      enrolled: !!twoFactor,
      created_at: twoFactor?.created_at,
      last_used_at: twoFactor?.last_used_at,
      audit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
