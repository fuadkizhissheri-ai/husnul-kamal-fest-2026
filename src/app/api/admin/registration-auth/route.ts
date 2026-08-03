import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ['reg_username', 'reg_auth_enabled'] },
      },
    });

    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      regUsername: settingsMap.reg_username || 'coordinator',
      regAuthEnabled: settingsMap.reg_auth_enabled !== 'false',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { regUsername, newPassword, confirmPassword, regAuthEnabled } = await req.json();

    if (regUsername && !regUsername.trim()) {
      return NextResponse.json({ error: 'Username cannot be empty' }, { status: 400 });
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
      }
    }

    // Save username
    if (regUsername) {
      await prisma.setting.upsert({
        where: { key: 'reg_username' },
        update: { value: regUsername.trim() },
        create: { key: 'reg_username', value: regUsername.trim() },
      });
    }

    // Save auth toggle
    if (regAuthEnabled !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'reg_auth_enabled' },
        update: { value: String(Boolean(regAuthEnabled)) },
        create: { key: 'reg_auth_enabled', value: String(Boolean(regAuthEnabled)) },
      });
    }

    // Hash and save new password if provided
    if (newPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.setting.upsert({
        where: { key: 'reg_password_hash' },
        update: { value: passwordHash },
        create: { key: 'reg_password_hash', value: passwordHash },
      });
    }

    return NextResponse.json({ success: true, message: 'Registration credentials saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
