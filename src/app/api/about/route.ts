export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { broadcastRealtimeChange } from '@/lib/realtime';

export async function GET() {
  try {
    const aboutSections = await prisma.aboutContent.findMany();
    const map: Record<string, any> = {};
    for (const item of aboutSections) {
      if (item.sectionKey) {
        map[item.sectionKey] = {
          title: item.title,
          body: item.body,
          extraJson: item.extraJson ? JSON.parse(item.extraJson) : null,
        };
      }
    }
    return NextResponse.json({ about: map, sections: aboutSections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch about content' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionKey, title, body, extraJson } = await request.json();

    if (!sectionKey || !title) {
      return NextResponse.json({ error: 'sectionKey and title are required.' }, { status: 400 });
    }

    const updated = await prisma.aboutContent.upsert({
      where: { sectionKey },
      update: {
        title,
        body: body || '',
        extraJson: typeof extraJson === 'object' ? JSON.stringify(extraJson) : extraJson || null,
      },
      create: {
        sectionKey,
        title,
        body: body || '',
        extraJson: typeof extraJson === 'object' ? JSON.stringify(extraJson) : extraJson || null,
      },
    });

    broadcastRealtimeChange('ABOUT_UPDATED', updated);

    return NextResponse.json({ success: true, section: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update about content' }, { status: 500 });
  }
}
