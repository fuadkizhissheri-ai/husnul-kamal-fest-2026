import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const passwordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 500 });
  }
}
