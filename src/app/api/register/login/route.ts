import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Rate limiting in-memory store
const failedAttempts: Record<string, { count: number; lockUntil: number }> = {};

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    // Check rate limiting lockout (5 failed attempts -> 5 min lockout)
    const record = failedAttempts[ip];
    if (record && record.lockUntil > now) {
      const waitMins = Math.ceil((record.lockUntil - now) / 60000);
      return NextResponse.json(
        { success: false, error: `Too many failed attempts. Locked out for ${waitMins} minutes.` },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Incorrect username or password' },
        { status: 400 }
      );
    }

    // Fetch stored registration credentials
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ['reg_username', 'reg_password_hash', 'reg_auth_enabled'] },
      },
    });

    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const expectedUsername = settingsMap.reg_username || 'coordinator';
    let storedHash = settingsMap.reg_password_hash;

    // Default password 'register123' if not set
    if (!storedHash) {
      storedHash = await bcrypt.hash('register123', 10);
      await prisma.setting.upsert({
        where: { key: 'reg_password_hash' },
        update: { value: storedHash },
        create: { key: 'reg_password_hash', value: storedHash },
      });
    }

    const isUsernameMatch = username.trim().toLowerCase() === expectedUsername.toLowerCase();
    const isPasswordMatch = isUsernameMatch ? await bcrypt.compare(password, storedHash) : false;

    if (!isUsernameMatch || !isPasswordMatch) {
      // Record failed attempt
      const attempts = (record?.count || 0) + 1;
      let lockUntil = 0;
      if (attempts >= 5) {
        lockUntil = now + 5 * 60 * 1000; // 5 minute lock
      }
      failedAttempts[ip] = { count: attempts, lockUntil };

      return NextResponse.json(
        { success: false, error: 'Incorrect username or password' },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    delete failedAttempts[ip];

    // Set secure HTTP-only session cookie
    const cookieStore = await cookies();
    cookieStore.set('reg_session', 'authenticated_coordinator_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return NextResponse.json({ success: true, message: 'Authentication successful' });
  } catch (error: any) {
    console.error('Registration Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error during authentication' },
      { status: 500 }
    );
  }
}
