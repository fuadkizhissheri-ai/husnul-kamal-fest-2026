import React from 'react';
import { prisma } from '@/lib/prisma';
import PrintableIDCard from '@/components/PrintableIDCard';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ side?: string }>;
}

export default async function RenderIDCardPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { side } = await searchParams;

  const participant = await prisma.participant.findFirst({
    where: {
      OR: [
        { id },
        { registrationId: id },
        { chestNumber: id },
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
    notFound();
  }

  const formattedParticipant = {
    registrationId: participant.registrationId,
    chestNumber: participant.chestNumber,
    fullName: participant.fullName,
    group: participant.group,
    category: participant.category,
    gender: participant.gender,
    whatsapp: participant.whatsapp,
    madrasa: participant.madrasa,
    photoUrl: participant.photoUrl,
    programmes: participant.registrations.map((r) => r.programme.name),
  };

  return (
    <html lang="en" className="dark">
      <head>
        <title>ID Card Render</title>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: transparent;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 340px;
            height: 560px;
          }
          .hide-buttons button {
            display: none !important;
          }
        `}</style>
      </head>
      <body>
        <div className="hide-buttons">
          <PrintableIDCard participant={formattedParticipant} initialSide={side === 'back' ? 'back' : 'front'} />
        </div>
      </body>
    </html>
  );
}
