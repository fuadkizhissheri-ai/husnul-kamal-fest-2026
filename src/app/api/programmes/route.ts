import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { broadcastRealtimeChange } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (category && category !== 'ALL') {
      where.OR = [
        { category },
        { category: 'General' },
      ];
    }
    if (activeOnly) where.isActive = true;

    const programmes = await prisma.programme.findMany({
      where,
      include: {
        results: {
          select: { id: true },
        },
        registrations: {
          include: {
            participant: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const formatted = programmes.map((p) => {
      let mavaddaCount = 0;
      let mahabbaCount = 0;

      p.registrations?.forEach((r) => {
        if (r.participant?.group === 'MAVADDA') mavaddaCount++;
        if (r.participant?.group === 'MAHABBA') mahabbaCount++;
      });

      const limit = p.participantLimit || 0;

      return {
        ...p,
        registeredCount: p.registrations ? p.registrations.length : 0,
        mavaddaCount,
        mahabbaCount,
        isMavaddaFull: limit > 0 ? mavaddaCount >= limit : false,
        isMahabbaFull: limit > 0 ? mahabbaCount >= limit : false,
      };
    });

    // Group into categoryProgrammes and generalProgrammes
    const categoryProgrammes = formatted.filter((p) => p.category === category);
    const generalProgrammes = formatted.filter((p) => p.category === 'General');

    return NextResponse.json({
      programmes: formatted,
      categoryProgrammes,
      generalProgrammes,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch programmes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, stage, date, startTime, endTime, participantLimit, isGroup, isActive } = body;

    if (!name || !category || !stage) {
      return NextResponse.json({ error: 'Name, Category, and Stage are required.' }, { status: 400 });
    }

    const programme = await prisma.programme.create({
      data: {
        name: name || '',
        category: category || '',
        stage: stage || 'Aura Stage',
        date: date || '2026-09-15',
        startTime: startTime || '09:00 AM',
        endTime: endTime || '11:00 AM',
        participantLimit: participantLimit ? parseInt(participantLimit, 10) : 10,
        isGroup: isGroup ?? false,
        isActive: isActive ?? true,
      },
    });

    // Create corresponding Schedule record
    await prisma.schedule.create({
      data: {
        programmeId: programme.id,
        stage: programme.stage,
        date: programme.date,
        startTime: programme.startTime,
        endTime: programme.endTime,
        status: 'UPCOMING',
      },
    });

    broadcastRealtimeChange('PROGRAMMES_UPDATED', programme);
    broadcastRealtimeChange('SCHEDULE_UPDATED', programme);

    return NextResponse.json({ success: true, programme }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create programme' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, category, stage, date, startTime, endTime, participantLimit, isGroup, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Programme ID is required.' }, { status: 400 });
    }

    const updated = await prisma.programme.update({
      where: { id },
      data: {
        name: name || undefined,
        category: category || undefined,
        stage: stage || undefined,
        date: date ?? undefined,
        startTime: startTime ?? undefined,
        endTime: endTime ?? undefined,
        participantLimit: participantLimit ? parseInt(participantLimit, 10) : undefined,
        isGroup: isGroup ?? undefined,
        isActive: isActive ?? undefined,
      },
    });

    // Sync Schedule record
    const existingSch = await prisma.schedule.findFirst({ where: { programmeId: id } });
    if (existingSch) {
      await prisma.schedule.update({
        where: { id: existingSch.id },
        data: {
          stage: updated.stage,
          date: updated.date,
          startTime: updated.startTime,
          endTime: updated.endTime,
        },
      });
    } else {
      await prisma.schedule.create({
        data: {
          programmeId: updated.id,
          stage: updated.stage,
          date: updated.date,
          startTime: updated.startTime,
          endTime: updated.endTime,
          status: 'UPCOMING',
        },
      });
    }

    broadcastRealtimeChange('PROGRAMMES_UPDATED', updated);
    broadcastRealtimeChange('SCHEDULE_UPDATED', updated);

    return NextResponse.json({ success: true, programme: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update programme' }, { status: 500 });
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
      return NextResponse.json({ error: 'Programme ID is required.' }, { status: 400 });
    }

    await prisma.programme.delete({
      where: { id },
    });

    broadcastRealtimeChange('PROGRAMMES_UPDATED', { deletedId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete programme' }, { status: 500 });
  }
}
