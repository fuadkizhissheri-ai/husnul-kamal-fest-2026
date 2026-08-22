import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { broadcastRealtimeChange } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const programmeId = searchParams.get('programmeId');
    const participantId = searchParams.get('participantId');
    const query = searchParams.get('q');
    const all = searchParams.get('all');

    const where: any = {};
    if (programmeId) where.programmeId = programmeId;
    if (participantId) where.participantId = participantId;

    if (category) {
      where.programme = { category };
    }

    if (all === 'true') {
      const session = await verifyAdminSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      where.isPublished = true;
    }

    if (query) {
      where.OR = [
        { position: { contains: query, mode: 'insensitive' } },
        { participant: { fullName: { contains: query, mode: 'insensitive' } } },
        { participant: { chestNumber: { contains: query, mode: 'insensitive' } } },
        { programme: { name: { contains: query, mode: 'insensitive' } } },
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
    const { programmeId, participantIds, participantId, position, points, certificateGenerated } = body;

    const idsToProcess = Array.isArray(participantIds) && participantIds.length > 0 
      ? participantIds 
      : (participantId ? [participantId] : []);

    if (!programmeId || idsToProcess.length === 0 || !position) {
      return NextResponse.json({ error: 'Programme, Participant(s), and Position are required.' }, { status: 400 });
    }

    const isGroupResult = idsToProcess.length > 1;
    // crypto.randomUUID() generates a v4 UUID
    const groupId = isGroupResult ? crypto.randomUUID() : null;
    const pointsInt = points ? parseInt(points, 10) : 0;

    // We create a result record for EACH participant.
    // If it's a group, they share the same groupId and the same points.
    const createdResults = await prisma.$transaction(
      idsToProcess.map((id: string) =>
        prisma.result.create({
          data: {
            programmeId,
            participantId: id,
            position,
            points: pointsInt,
            certificateGenerated: certificateGenerated ?? true,
            groupId,
          },
          include: {
            programme: true,
            participant: true,
          },
        })
      )
    );

    // Broadcast instant real-time event to all connected clients & TV screens
    createdResults.forEach(r => broadcastRealtimeChange('RESULTS_UPDATED', r));

    return NextResponse.json({ success: true, result: createdResults[0], count: createdResults.length });
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

    const existingResult = await prisma.result.findUnique({ where: { id } });
    if (!existingResult) {
      return NextResponse.json({ error: 'Result not found.' }, { status: 404 });
    }

    const updatedData = {
      programmeId,
      position,
      points: points !== undefined ? parseInt(points, 10) : undefined,
      certificateGenerated,
    };

    if (existingResult.groupId) {
      // If it's part of a group, we shouldn't change the participantId here, but we should update points/position for all
      await prisma.result.updateMany({
        where: { groupId: existingResult.groupId },
        data: updatedData,
      });

      // Refetch the specific one we were editing to return it
      const updated = await prisma.result.findUnique({
        where: { id },
        include: { programme: true, participant: true },
      });

      broadcastRealtimeChange('RESULTS_UPDATED', updated);
      return NextResponse.json({ success: true, result: updated });
    } else {
      const updated = await prisma.result.update({
        where: { id },
        data: {
          ...updatedData,
          participantId,
        },
        include: {
          programme: true,
          participant: true,
        },
      });

      broadcastRealtimeChange('RESULTS_UPDATED', updated);
      return NextResponse.json({ success: true, result: updated });
    }
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

    const resultToDelete = await prisma.result.findUnique({ where: { id } });
    if (!resultToDelete) {
      return NextResponse.json({ error: 'Result not found.' }, { status: 404 });
    }

    if (resultToDelete.groupId) {
      await prisma.result.deleteMany({
        where: { groupId: resultToDelete.groupId },
      });
      // Broadcast instant real-time event for the group delete
      broadcastRealtimeChange('RESULTS_UPDATED', { deletedGroupId: resultToDelete.groupId });
    } else {
      await prisma.result.delete({
        where: { id },
      });
      // Broadcast instant real-time event
      broadcastRealtimeChange('RESULTS_UPDATED', { deletedId: id });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete result' }, { status: 500 });
  }
}
