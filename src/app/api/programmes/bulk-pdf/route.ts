import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastRealtimeChange } from '@/lib/realtime';
import pdfParse from 'pdf-parse';

// Increase max payload size for PDF uploads
export const maxDuration = 60; 

export async function POST(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const action = formData.get('action');

    if (action === 'parse') {
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      let parsedText = '';
      
      try {
        const data = await pdfParse(buffer);
        parsedText = data.text;
      } catch (err: any) {
        return NextResponse.json({ error: 'Failed to parse PDF. Ensure the file is not encrypted and contains extractable text.' }, { status: 400 });
      }

      const lines = parsedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const parsedRows = [];
      
      let idCounter = 1;
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('programme name') || lower.includes('sl no') || lower.includes('category')) {
          continue;
        }

        parsedRows.push({
          id: `draft-${idCounter++}`,
          name: line.substring(0, 50), 
          category: 'General',
          stage: 'Aura',
          date: '2026-09-15',
          startTime: '09:00 AM',
          endTime: '11:00 AM',
          isGroup: false,
          participantLimit: 10,
          rawLine: line 
        });
      }

      return NextResponse.json({ success: true, rows: parsedRows });
    } 
    
    if (action === 'insert') {
      const itemsRaw = formData.get('items') as string;
      if (!itemsRaw) return NextResponse.json({ error: 'No items to insert' }, { status: 400 });
      
      const items = JSON.parse(itemsRaw);
      
      const results = await prisma.$transaction(
        items.map((item: any) => 
          prisma.programme.create({
            data: {
              name: item.name || '',
              category: item.category || 'General',
              stage: item.stage || 'Aura',
              date: item.date || '2026-09-15',
              startTime: item.startTime || '09:00 AM',
              endTime: item.endTime || '11:00 AM',
              participantLimit: parseInt(item.participantLimit, 10) || 10,
              isGroup: item.isGroup ?? false,
              isActive: true,
            }
          })
        )
      );

      for (const p of results) {
        await prisma.schedule.create({
          data: {
            programmeId: p.id,
            stage: p.stage,
            date: p.date,
            startTime: p.startTime,
            endTime: p.endTime,
            status: 'UPCOMING'
          }
        });
      }

      broadcastRealtimeChange('PROGRAMMES_UPDATED', { bulk: true });
      broadcastRealtimeChange('SCHEDULE_UPDATED', { bulk: true });

      return NextResponse.json({ success: true, count: results.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Bulk PDF Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Server error during bulk upload' }, { status: 500 });
  }
}
