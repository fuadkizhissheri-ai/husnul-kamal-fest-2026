export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { broadcastRealtimeChange } from '@/lib/realtime';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    const where: any = {};
    if (category) where.categoryBadge = category;
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { body: { contains: query } },
        { refNumber: { contains: query } },
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: contentBody, categoryBadge, refNumber, coordinatorName, coordinatorDesignation, signatureUrl, pdfUrl } = body;

    if (!title || !contentBody) {
      return NextResponse.json({ error: 'Title and Body are required.' }, { status: 400 });
    }

    // Auto-generate sequential Reference Number if not provided
    let finalRefNumber = refNumber;
    if (!finalRefNumber) {
      const count = await prisma.announcement.count();
      finalRefNumber = `HK/2026/CIR-${String(count + 1).padStart(3, '0')}`;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: contentBody,
        categoryBadge: categoryBadge || 'General',
        refNumber: finalRefNumber,
        coordinatorName: coordinatorName || 'Sayyid Muhammed Al-Hadi',
        coordinatorDesignation: coordinatorDesignation || 'Programme Coordinator, Husnul Kamal Fest 2026',
        signatureUrl: signatureUrl || null,
        pdfUrl: pdfUrl || null,
      },
    });

    broadcastRealtimeChange('ANNOUNCEMENTS_UPDATED', announcement);

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create announcement' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, body: contentBody, categoryBadge, refNumber, coordinatorName, coordinatorDesignation, signatureUrl, pdfUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required.' }, { status: 400 });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        body: contentBody,
        categoryBadge,
        refNumber,
        coordinatorName,
        coordinatorDesignation,
        signatureUrl,
        pdfUrl,
      },
    });

    broadcastRealtimeChange('ANNOUNCEMENTS_UPDATED', updated);

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update announcement' }, { status: 500 });
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
      return NextResponse.json({ error: 'Announcement ID is required.' }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    broadcastRealtimeChange('ANNOUNCEMENTS_UPDATED', { deletedId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete announcement' }, { status: 500 });
  }
}
