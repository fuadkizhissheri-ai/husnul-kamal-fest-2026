import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { broadcastRealtimeChange } from '@/lib/realtime';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Result ID is required.' }, { status: 400 });
    }

    const body = await request.json();
    const { isPublished } = body;

    const updated = await prisma.result.update({
      where: { id },
      data: { isPublished },
      include: {
        programme: true,
        participant: true,
      },
    });

    broadcastRealtimeChange('RESULTS_UPDATED', updated);

    return NextResponse.json({ success: true, result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to toggle publish status' }, { status: 500 });
  }
}
