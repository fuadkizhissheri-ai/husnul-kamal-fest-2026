import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Mavadda (Range 101 - 299)
    const mavaddaParticipants = await prisma.participant.findMany({
      where: { group: 'MAVADDA' },
      select: { chestNumber: true },
    });

    const mavaddaNumbers = mavaddaParticipants
      .map((p) => parseInt(p.chestNumber.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n) && n >= 101 && n <= 299);

    const maxMavadda = mavaddaNumbers.length > 0 ? Math.max(...mavaddaNumbers) : 100;
    const nextMavadda = maxMavadda + 1;
    const mavaddaIsFull = nextMavadda > 299;
    const mavaddaRemaining = Math.max(0, 299 - (mavaddaNumbers.length > 0 ? maxMavadda : 100));

    // 2. Mahabba (Range 301 - 499)
    const mahabbaParticipants = await prisma.participant.findMany({
      where: { group: 'MAHABBA' },
      select: { chestNumber: true },
    });

    const mahabbaNumbers = mahabbaParticipants
      .map((p) => parseInt(p.chestNumber.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n) && n >= 301 && n <= 499);

    const maxMahabba = mahabbaNumbers.length > 0 ? Math.max(...mahabbaNumbers) : 300;
    const nextMahabba = maxMahabba + 1;
    const mahabbaIsFull = nextMahabba > 499;
    const mahabbaRemaining = Math.max(0, 499 - (mahabbaNumbers.length > 0 ? maxMahabba : 300));

    return NextResponse.json({
      MAVADDA: {
        nextChestNumber: mavaddaIsFull ? null : String(nextMavadda),
        isFull: mavaddaIsFull,
        remaining: mavaddaRemaining,
        min: 101,
        max: 299,
      },
      MAHABBA: {
        nextChestNumber: mahabbaIsFull ? null : String(nextMahabba),
        isFull: mahabbaIsFull,
        remaining: mahabbaRemaining,
        min: 301,
        max: 499,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to calculate chest numbers' }, { status: 500 });
  }
}
