export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Check if registration auth is enabled
    const authSetting = await prisma.setting.findUnique({
      where: { key: 'reg_auth_enabled' },
    });

    const authRequired = authSetting ? authSetting.value === 'true' : true;

    if (!authRequired) {
      return NextResponse.json({ authenticated: true, authRequired: false });
    }

    const cookieStore = await cookies();
    const regSession = cookieStore.get('reg_session');

    if (regSession?.value === 'authenticated_coordinator_session') {
      const usernameSetting = await prisma.setting.findUnique({
        where: { key: 'reg_username' },
      });

      return NextResponse.json({
        authenticated: true,
        authRequired: true,
        username: usernameSetting?.value || 'coordinator',
      });
    }

    return NextResponse.json({ authenticated: false, authRequired: true });
  } catch (error: any) {
    console.error('Registration me API error:', error);
    return NextResponse.json({ authenticated: false, authRequired: true }, { status: 500 });
  }
}
