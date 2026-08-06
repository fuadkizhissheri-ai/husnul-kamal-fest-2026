import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import pdfParse from 'pdf-parse';

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
        return NextResponse.json({ error: 'Failed to parse PDF.' }, { status: 400 });
      }

      const lines = parsedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const parsedRows = [];
      
      let idCounter = 1;
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('chest no') || lower.includes('registration id') || lower.includes('name')) {
          continue;
        }

        parsedRows.push({
          id: `draft-${idCounter++}`,
          registrationId: `HK2026-${Math.floor(1000 + Math.random() * 9000)}`, // Auto generate temp ID if missing
          chestNumber: `TBA-${Math.floor(100 + Math.random() * 900)}`,
          fullName: line.substring(0, 50),
          group: 'MAVADDA',
          category: 'General',
          gender: 'Male',
          dob: '2010-01-01',
          madrasa: 'Mifthahul Uloom Madrasa',
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
          prisma.participant.create({
            data: {
              registrationId: item.registrationId || `HK2026-${Math.floor(1000 + Math.random() * 9000)}`,
              chestNumber: item.chestNumber || `TBA-${Math.floor(100 + Math.random() * 900)}`,
              fullName: item.fullName || 'Unknown',
              group: item.group || 'MAVADDA',
              category: item.category || 'General',
              gender: item.gender || 'Male',
              dob: item.dob || '2010-01-01',
              madrasa: item.madrasa || 'Mifthahul Uloom Madrasa',
            }
          })
        )
      );

      return NextResponse.json({ success: true, count: results.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Bulk PDF Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Server error during bulk upload' }, { status: 500 });
  }
}
