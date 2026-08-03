export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('registrationId') || searchParams.get('chestNumber');
    const side = searchParams.get('side') || 'front';

    if (!id) {
      return NextResponse.json({ error: 'Participant ID, registrationId, or chestNumber required' }, { status: 400 });
    }

    const participant = await prisma.participant.findFirst({
      where: {
        OR: [
          { id },
          { registrationId: id },
          { chestNumber: id },
        ],
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const targetUrl = `${protocol}://${host}/render/id-card/${participant.id}?side=${side}`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 340, height: 560, deviceScaleFactor: 4 });
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });

    // Wait for document fonts and settlement
    await page.evaluate(() => document.fonts.ready);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const imageBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 98,
      clip: { x: 0, y: 0, width: 340, height: 560 },
    });

    await browser.close();

    const filename = `ID-CARD_${side.toUpperCase()}_${participant.chestNumber}_${participant.fullName.replace(/\s+/g, '_')}.jpg`;

    return new Response(imageBuffer as any, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Puppeteer ID Card download error:', error);
    return NextResponse.json({ error: error.message || 'Failed to render ID Card' }, { status: 500 });
  }
}
