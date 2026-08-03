import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalParticipants, totalProgrammes, resultsPublished, announcementsCount] = await Promise.all([
      prisma.participant.count(),
      prisma.programme.count(),
      prisma.result.count(),
      prisma.announcement.count(),
    ]);

    // Registration growth over time
    const participants = await prisma.participant.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date YYYY-MM-DD
    const growthMap: Record<string, number> = {};
    let cumulative = 0;

    for (const p of participants) {
      const dateStr = p.createdAt.toISOString().split('T')[0];
      cumulative += 1;
      growthMap[dateStr] = cumulative;
    }

    const growthChart = Object.entries(growthMap).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      stats: {
        totalParticipants,
        totalProgrammes,
        resultsPublished,
        announcementsCount,
      },
      growthChart,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
