export const dynamic = 'force-static';
import { NextResponse } from 'next/server';

/**
 * File Upload Route
 * Converts uploaded images to data URLs for database storage without writing files to disk.
 * Prevents triggering Next.js dev-server file watchers and infinite HMR rebuild loops.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ success: true, url: dataUrl, fileName: file.name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}
