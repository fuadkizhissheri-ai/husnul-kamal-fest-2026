import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { broadcastRealtimeChange } from '@/lib/realtime';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const programmeId = searchParams.get('programmeId');
    const participantId = searchParams.get('participantId');
    const query = searchParams.get('q');

    const where: any = {};
    if (programmeId) where.programmeId = programmeId;
    if (participantId) where.participantId = participantId;

    if (category) {
      where.programme = { category };
    }

    if (query) {
      where.OR = [
        { position: { contains: query } },
        { participant: { fullName: { contains: query } } },
        { participant: { chestNumber: { contains: query } } },
        { programme: { name: { contains: query } } },
      ];
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        programme: true,
        participant: true,
      },
      orderBy: [{ points: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch results' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { programmeId, participantId, position, points, certificateGenerated } = body;

    if (!programmeId || !participantId || !position) {
      return NextResponse.json({ error: 'Programme, Participant, and Position are required.' }, { status: 400 });
    }

    const result = await prisma.result.create({
      data: {
        programmeId,
        participantId,
        position,
        points: points ? parseInt(points, 10) : 0,
        certificateGenerated: certificateGenerated ?? true,
      },
      include: {
        programme: true,
        participant: true,
      },
    });

    // Broadcast instant real-time event to all connected clients & TV screens
    broadcastRealtimeChange('RESULTS_UPDATED', result);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add result' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, programmeId, participantId, position, points, certificateGenerated } = body;

    if (!id) {
      return NextResponse.json({ error: 'Result ID is required.' }, { status: 400 });
    }

    const updated = await prisma.result.update({
      where: { id },
      data: {
        programmeId,
        participantId,
        position,
        points: points !== undefined ? parseInt(points, 10) : undefined,
        certificateGenerated,
      },
      include: {
        programme: true,
        participant: true,
      },
    });

    // Broadcast instant real-time event
    broadcastRealtimeChange('RESULTS_UPDATED', updated);

    return NextResponse.json({ success: true, result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update result' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Result ID is required.' }, { status: 400 });
    }

    await prisma.result.delete({
      where: { id },
    });

    // Broadcast instant real-time event
    broadcastRealtimeChange('RESULTS_UPDATED', { deletedId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete result' }, { status: 500 });
  }
}
