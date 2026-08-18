import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { broadcastRealtimeChange } from '@/lib/realtime';
import { getStageInfo } from '@/lib/stages';
import { autoSyncScheduleStatuses } from '@/lib/scheduleAutoSync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    // 0. Auto-sync time-based status transitions before fetching
    await autoSyncScheduleStatuses();

    // 1. Fetch explicit Schedule records
    const explicitSchedules = await prisma.schedule.findMany({
      include: {
        programme: true,
      },
    });

    const scheduledProgIds = new Set(explicitSchedules.map((s) => s.programmeId));

    // 2. Fetch all active Programmes not yet in Schedule table
    const unscheduledProgrammes = await prisma.programme.findMany({
      where: {
        isActive: true,
        id: { notIn: Array.from(scheduledProgIds) },
      },
    });

    // 3. Create virtual schedule items ONLY for programmes that actually have timing/stage set
    const virtualSchedules = unscheduledProgrammes
      .filter((p) => p.stage && p.date)
      .map((p) => ({
        id: `virtual-${p.id}`,
        programmeId: p.id,
        stage: p.stage as string,
        date: p.date as string,
        startTime: p.startTime || '09:00 AM',
        endTime: p.endTime || '11:00 AM',
        status: 'UPCOMING',
        programme: p,
        isVirtual: true,
        createdAt: p.createdAt,
      }));

    // 4. Merge all schedules
    let allSchedules = [...explicitSchedules, ...virtualSchedules];

    console.log(`[Schedule API] Fetched ${explicitSchedules.length} explicit schedules + ${virtualSchedules.length} programme schedules = ${allSchedules.length} total items`);

    // 5. Apply filters
    if (stage && stage !== 'ALL') {
      const targetStageId = getStageInfo(stage).id.toLowerCase();
      allSchedules = allSchedules.filter((s) => {
        const sStageId = getStageInfo(s.stage).id.toLowerCase();
        return sStageId === targetStageId || (s.stage && s.stage.toLowerCase().includes(targetStageId));
      });
    }

    if (status && status !== 'ALL') {
      allSchedules = allSchedules.filter((s) => s.status === status);
    }

    if (category && category !== 'ALL') {
      allSchedules = allSchedules.filter((s) => s.programme?.category === category);
    }

    if (query) {
      const q = query.toLowerCase();
      allSchedules = allSchedules.filter(
        (s) =>
          (s.stage && s.stage.toLowerCase().includes(q)) ||
          (s.programme?.name && s.programme.name.toLowerCase().includes(q))
      );
    }

    // 6. Sort by Date -> Start Time -> Stage
    allSchedules.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = a.startTime || '';
      const timeB = b.startTime || '';
      if (timeA !== timeB) return timeA.localeCompare(timeB);

      return (a.stage || '').localeCompare(b.stage || '');
    });

    console.log(`[Schedule API] Returning ${allSchedules.length} filtered schedule items`);

    return NextResponse.json(
      { schedules: allSchedules },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[Schedule API Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { programmeId, stage, date, startTime, endTime, status } = body;

    if (!programmeId || !stage || !date) {
      return NextResponse.json({ error: 'Programme, Stage, and Date are required.' }, { status: 400 });
    }

    const scheduleItem = await prisma.schedule.create({
      data: {
        programmeId,
        stage: stage || 'Aura Stage',
        date: date || '2026-09-15',
        startTime: startTime || '09:00 AM',
        endTime: endTime || '11:00 AM',
        status: status || 'UPCOMING',
      },
      include: {
        programme: true,
      },
    });

    // Also update Programme model stage & timing
    await prisma.programme.update({
      where: { id: programmeId },
      data: {
        stage: scheduleItem.stage,
        date: scheduleItem.date,
        startTime: scheduleItem.startTime,
        endTime: scheduleItem.endTime,
      },
    });

    broadcastRealtimeChange('SCHEDULE_UPDATED', scheduleItem);

    return NextResponse.json({ success: true, schedule: scheduleItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add schedule item' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, stage, date, startTime, endTime, status, programmeId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required.' }, { status: 400 });
    }

    // Handle virtual schedule items (id starts with virtual-)
    let updated;
    if (id.startsWith('virtual-')) {
      const realProgId = programmeId || id.replace('virtual-', '');
      updated = await prisma.schedule.create({
        data: {
          programmeId: realProgId,
          stage,
          date,
          startTime,
          endTime,
          status,
        },
        include: {
          programme: true,
        },
      });
    } else {
      updated = await prisma.schedule.update({
        where: { id },
        data: {
          stage,
          date,
          startTime,
          endTime,
          status,
          programmeId,
        },
        include: {
          programme: true,
        },
      });
    }

    // Update programme timing
    if (updated.programmeId) {
      await prisma.programme.update({
        where: { id: updated.programmeId },
        data: {
          stage: updated.stage,
          date: updated.date,
          startTime: updated.startTime,
          endTime: updated.endTime,
        },
      });
    }

    broadcastRealtimeChange('SCHEDULE_UPDATED', updated);

    return NextResponse.json({ success: true, schedule: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update schedule item' }, { status: 500 });
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
      return NextResponse.json({ error: 'Schedule ID is required.' }, { status: 400 });
    }

    let programmeIdToClear: string | null = null;

    if (id.startsWith('virtual-')) {
      programmeIdToClear = id.replace('virtual-', '');
    } else {
      const schedule = await prisma.schedule.findUnique({ where: { id } });
      if (schedule) {
        programmeIdToClear = schedule.programmeId;
        await prisma.schedule.delete({ where: { id } });
      }
    }

    if (programmeIdToClear) {
      await prisma.programme.update({
        where: { id: programmeIdToClear },
        data: {
          stage: '',
          date: '',
          startTime: '',
          endTime: '',
        },
      });
    }

    broadcastRealtimeChange('SCHEDULE_UPDATED', { deletedId: id });

    return NextResponse.json({ status: 'success', message: 'Schedule deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete schedule item' }, { status: 500 });
  }
}
