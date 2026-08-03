export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }

    const participant = await prisma.participant.findFirst({
      where: {
        OR: [
          { id: participantId },
          { registrationId: participantId },
          { chestNumber: participantId },
        ],
      },
      include: {
        registrations: {
          include: {
            programme: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const payload = {
      studentName: participant.fullName,
      chestNumber: participant.chestNumber,
      group: participant.group,
      category: participant.category,
      madrasa: participant.madrasa,
      whatsappNumber: participant.whatsapp,
      programmes: participant.registrations.map((r) => r.programme.name),
    };

    const result = await sendWhatsAppConfirmation(payload);

    return NextResponse.json({
      success: result.success,
      method: result.method,
      messageId: result.messageId,
      info: result.error || 'WhatsApp confirmation dispatched successfully',
    });
  } catch (error: any) {
    console.error('WhatsApp trigger endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch WhatsApp message' }, { status: 500 });
  }
}
