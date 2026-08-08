import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/auth';
import { broadcastRealtimeChange } from '@/lib/realtime';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const group = searchParams.get('group');
    const query = searchParams.get('q');

    const where: any = {};
    if (category) where.category = category;
    if (group) where.group = group;
    if (query) {
      where.OR = [
        { fullName: { contains: query } },
        { registrationId: { contains: query } },
        { chestNumber: { contains: query } },
        { whatsapp: { contains: query } },
      ];
    }

    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;

    const totalCount = await prisma.participant.count({ where });

    const queryOptions: any = {
      where,
      include: {
        registrations: {
          include: {
            programme: true,
          },
        },
        results: {
          include: {
            programme: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    };

    if (page && limit) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const participants = await prisma.participant.findMany(queryOptions);

    return NextResponse.json({
      participants,
      totalCount,
      page: page || 1,
      totalPages: limit ? Math.ceil(totalCount / limit) : 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch participants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Check if registration is open
    const regOpenSetting = await prisma.setting.findUnique({
      where: { key: 'registration_open' },
    });
    if (regOpenSetting && regOpenSetting.value === 'false') {
      return NextResponse.json({ error: 'Delegate Registration is currently closed by Admin.' }, { status: 400 });
    }

    // 1b. Check if registration auth login is required
    const regAuthSetting = await prisma.setting.findUnique({
      where: { key: 'reg_auth_enabled' },
    });
    const isAuthRequired = regAuthSetting ? regAuthSetting.value === 'true' : true;

    if (isAuthRequired) {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const regSession = cookieStore.get('reg_session');
      const isAdmin = await verifyAdminSession();

      if (!isAdmin && regSession?.value !== 'authenticated_coordinator_session') {
        return NextResponse.json(
          { error: 'Unauthorized: Registration panel login required to submit delegate registrations.' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { fullName, group, category, gender, dob, whatsapp, photoUrl, programmeIds } = body;

    if (!fullName || !group || !category || !gender || !dob || !whatsapp) {
      return NextResponse.json({ error: 'All required fields must be provided.' }, { status: 400 });
    }

    // Check group validity
    if (group !== 'MAVADDA' && group !== 'MAHABBA') {
      return NextResponse.json({ error: 'Invalid group selection.' }, { status: 400 });
    }

    // Check max programmes setting
    const maxProgSetting = await prisma.setting.findUnique({
      where: { key: 'max_programmes_per_participant' },
    });
    const maxAllowed = maxProgSetting ? parseInt(maxProgSetting.value, 10) || 3 : 3;

    const selectedProgrammeIds: string[] = Array.isArray(programmeIds) ? programmeIds : [];
    
    // Fetch selected programmes to check their type
    const selectedProgrammes = await prisma.programme.findMany({
      where: { id: { in: selectedProgrammeIds } },
    });
    
    // Count only single items (not group and not general)
    const singleItemsCount = selectedProgrammes.filter(p => !p.isGroup && p.category.toLowerCase() !== 'general').length;

    if (singleItemsCount > maxAllowed) {
      return NextResponse.json(
        { error: `You can select a maximum of ${maxAllowed} Single items. Group and General items are excluded from this limit.` },
        { status: 400 }
      );
    }

    // Verify per-programme participant limits
    for (const progId of selectedProgrammeIds) {
      const prog = await prisma.programme.findUnique({
        where: { id: progId },
        include: {
          registrations: {
            include: {
              participant: true,
            },
          },
        },
      });

      if (!prog) {
        return NextResponse.json({ error: `Programme not found: ${progId}` }, { status: 404 });
      }

      if (prog.participantLimit && prog.participantLimit > 0) {
        const genderGroupRegistrationCount = prog.registrations.filter(
          (r) => r.participant?.group === group && r.participant?.gender === gender
        ).length;

        if (genderGroupRegistrationCount >= prog.participantLimit) {
          return NextResponse.json(
            { error: `Registration full for ${gender} candidates in ${group} for programme "${prog.name}" (Limit ${prog.participantLimit} reached).` },
            { status: 400 }
          );
        }
      }
    }

    // 2. Sequential Chest Number Generation per Group
    // Mavadda: 101 - 299
    // Mahabba: 301 - 499
    const existingGroupParticipants = await prisma.participant.findMany({
      where: { group },
      select: { chestNumber: true },
    });

    const minRange = group === 'MAVADDA' ? 101 : 301;
    const maxRange = group === 'MAVADDA' ? 299 : 499;

    const assignedNums = existingGroupParticipants
      .map((p) => parseInt(p.chestNumber.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n) && n >= minRange && n <= maxRange);

    const maxAssigned = assignedNums.length > 0 ? Math.max(...assignedNums) : minRange - 1;
    const nextChestNum = maxAssigned + 1;

    if (nextChestNum > maxRange) {
      return NextResponse.json(
        { error: `No more chest numbers available for this group (${group} range ${minRange}–${maxRange} is exhausted).` },
        { status: 400 }
      );
    }

    const chestNumber = String(nextChestNum);

    // 3. Atomic Registration ID (HK2026-0001)
    // Find the highest existing registration ID to avoid unique constraint failures after deletions
    const lastParticipant = await prisma.participant.findFirst({
      orderBy: { registrationId: 'desc' },
      select: { registrationId: true },
    });

    let nextIdNum = 1;
    if (lastParticipant && lastParticipant.registrationId) {
      const match = lastParticipant.registrationId.match(/HK2026-(\d+)/);
      if (match) {
        nextIdNum = parseInt(match[1], 10) + 1;
      } else {
        const totalCount = await prisma.participant.count();
        nextIdNum = totalCount + 1;
      }
    }
    const registrationId = `HK2026-${String(nextIdNum).padStart(4, '0')}`;

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        registrationId,
        chestNumber,
        fullName,
        group,
        category,
        gender,
        dob,
        whatsapp,
        photoUrl: photoUrl || null,
        registrations: {
          create: selectedProgrammeIds.map((progId) => ({
            programmeId: progId,
          })),
        },
      },
      include: {
        registrations: {
          include: {
            programme: true,
          },
        },
      },
    });

    // Broadcast instant real-time event
    broadcastRealtimeChange('PARTICIPANTS_UPDATED', participant);

    // Fire non-blocking background WhatsApp confirmation dispatch
    const programmeNames = participant.registrations.map((r) => r.programme.name);
    import('@/lib/whatsapp').then(({ sendWhatsAppConfirmation }) => {
      sendWhatsAppConfirmation({
        studentName: participant.fullName,
        chestNumber: participant.chestNumber,
        group: participant.group,
        category: participant.category,
        madrasa: participant.madrasa,
        whatsappNumber: participant.whatsapp,
        programmes: programmeNames,
      }).catch((err) => console.error('Background WhatsApp notification error:', err));
    }).catch((err) => console.error('WhatsApp module import error:', err));

    return NextResponse.json({ success: true, participant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, fullName, group, category, gender, dob, whatsapp, madrasa, photoUrl, chestNumber, programmeIds } = body;

    if (!id || !fullName || !group || !category || !chestNumber) {
      return NextResponse.json({ error: 'Required fields (Name, Group, Category, Chest Number) cannot be empty.' }, { status: 400 });
    }

    // 1. Check Chest Number Uniqueness
    const existingWithChest = await prisma.participant.findFirst({
      where: {
        chestNumber: chestNumber.trim(),
        id: { not: id },
      },
    });

    if (existingWithChest) {
      return NextResponse.json(
        { error: `Chest Number "${chestNumber}" is already assigned to another participant (${existingWithChest.fullName}).` },
        { status: 400 }
      );
    }

    // 2. Check Chest Number Range per Group
    const numericChest = parseInt(chestNumber.replace(/\D/g, ''), 10);
    if (!isNaN(numericChest)) {
      if (group === 'MAVADDA' && (numericChest < 101 || numericChest > 299)) {
        return NextResponse.json(
          { error: `Invalid Chest Number ${numericChest} for MAVADDA House (Allowed range: 101–299).` },
          { status: 400 }
        );
      }
      if (group === 'MAHABBA' && (numericChest < 301 || numericChest > 499)) {
        return NextResponse.json(
          { error: `Invalid Chest Number ${numericChest} for MAHABBA House (Allowed range: 301–499).` },
          { status: 400 }
        );
      }
    }

    // 3. Check max programmes setting
    if (Array.isArray(programmeIds)) {
      const maxProgSetting = await prisma.setting.findUnique({
        where: { key: 'max_programmes_per_participant' },
      });
      const maxAllowed = maxProgSetting ? parseInt(maxProgSetting.value, 10) || 3 : 3;

      // Fetch selected programmes to check their type
      const selectedProgrammes = await prisma.programme.findMany({
        where: { id: { in: programmeIds } },
      });
      
      // Count only single items (not group and not general)
      const singleItemsCount = selectedProgrammes.filter(p => !p.isGroup && p.category.toLowerCase() !== 'general').length;

      if (singleItemsCount > maxAllowed) {
        return NextResponse.json(
          { error: `Cannot assign more than ${maxAllowed} Single items per participant. Group and General items are excluded.` },
          { status: 400 }
        );
      }

      // Verify programme limits for newly selected programmes
      for (const progId of programmeIds) {
        const prog = await prisma.programme.findUnique({
          where: { id: progId },
          include: {
            registrations: {
              include: { participant: true },
            },
          },
        });

        if (prog && prog.participantLimit > 0) {
          const genderGroupCount = prog.registrations.filter(
            (r) => r.participant?.group === group && r.participant?.gender === gender && r.participantId !== id
          ).length;

          if (genderGroupCount >= prog.participantLimit) {
            return NextResponse.json(
              { error: `Programme "${prog.name}" has reached max capacity (${prog.participantLimit}) for ${gender} candidates in ${group} House.` },
              { status: 400 }
            );
          }
        }
      }

      await prisma.registration.deleteMany({
        where: { participantId: id },
      });

      await prisma.registration.createMany({
        data: programmeIds.map((pId: string) => ({
          participantId: id,
          programmeId: pId,
        })),
      });
    }

    const updated = await prisma.participant.update({
      where: { id },
      data: {
        fullName: fullName.trim(),
        group,
        category,
        gender: gender || 'Male',
        dob: dob || '',
        whatsapp: whatsapp || '',
        madrasa: madrasa || 'Mifthahul Uloom Madrasa',
        photoUrl: photoUrl || null,
        chestNumber: chestNumber.trim(),
      },
      include: {
        registrations: {
          include: { programme: true },
        },
      },
    });

    // Broadcast real-time update
    broadcastRealtimeChange('PARTICIPANTS_UPDATED', updated);

    return NextResponse.json({ success: true, participant: updated });
  } catch (error: any) {
    console.error('Participant edit PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update participant' }, { status: 500 });
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
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    await prisma.participant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete participant' }, { status: 500 });
  }
}
