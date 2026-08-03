export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { clearAdminSession, verifyAdminSession } from '@/lib/auth';

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await verifyAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}
