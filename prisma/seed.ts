import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Husnul Kamal — Meelad Fest 2026 Database...');

  // Clean existing transactional tables for idempotent seed
  await prisma.registration.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.programme.deleteMany({});

  // 1. Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { passwordHash },
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // 2. Settings
  const defaultSettings = [
    { key: 'fest_title', value: 'Husnul Kamal — Meelad Fest 2026' },
    { key: 'fest_venue', value: 'Mifthahul Uloom Madrasa, Ullisherikkunnu' },
    { key: 'registration_open', value: 'true' },
    { key: 'max_programmes_per_participant', value: '3' },
    { key: 'fest_date', value: '2026-09-15T09:00:00.000Z' },
    { key: 'theme_primary', value: '#0B5D3B' },
    { key: 'theme_gold', value: '#D97706' },
    { key: 'contact_phone', value: '+91 73064 80848' },
    { key: 'contact_email', value: 'mifthahululoomuk@gmail.com' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 3. About Content
  const aboutEntries = [
    {
      sectionKey: 'history',
      title: 'Our Heritage & Journey',
      body: 'Mifthahul Uloom Madrasa Ullisherikkunnu has been a beacon of Islamic learning, values, and community unity for over three decades. Husnul Kamal Meelad Fest is our flagship annual cultural & artistic celebration dedicated to honoring the birth of Prophet Muhammad ﷺ.',
    },
    {
      sectionKey: 'vision',
      title: 'Our Sacred Vision',
      body: 'To inspire young hearts with authentic Islamic scholarship, artistic excellence, character refinement, and deep love for the Messenger of Allah ﷺ through engaging competitions and collaborative learning.',
    },
    {
      sectionKey: 'mission',
      title: 'Our Mission',
      body: 'Providing an encouraging platform for students in Sub Junior, Junior, Senior, and Super Senior categories to discover and present their talents in Qirat, Mawlid recitation, Islamic speeches, calligraphy, and group songs.',
    },
    {
      sectionKey: 'prophet_love',
      title: 'Love for Prophet Muhammad ﷺ',
      body: 'The central theme of Husnul Kamal is radiating the compassion, sunnah, and noble character of Sayyidina Muhammad ﷺ across our students, families, and society.',
    },
    {
      sectionKey: 'stats',
      title: 'Fest Key Figures',
      body: 'Stats overview',
      extraJson: JSON.stringify({
        total_delegates: 450,
        programmes_count: 32,
        categories_count: 4,
        stages_count: 3,
        total_prizes: 120,
      }),
    },
  ];

  for (const entry of aboutEntries) {
    await prisma.aboutContent.upsert({
      where: { sectionKey: entry.sectionKey },
      update: entry,
      create: entry,
    });
  }

  // 4. Programmes
  const sampleProgrammes = [
    {
      name: 'Quran Recitation (Qirat)',
      category: 'Sub Junior',
      stage: 'Stage 1 (Imam Bukhari Stage)',
      date: '2026-09-15',
      startTime: '09:30 AM',
      endTime: '11:00 AM',
      participantLimit: 15,
    },
    {
      name: 'Madf Qaseeda',
      category: 'Sub Junior',
      stage: 'Stage 2 (Imam Shafi Stage)',
      date: '2026-09-15',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      participantLimit: 12,
    },
    {
      name: 'Malayalam Islamic Speech',
      category: 'Junior',
      stage: 'Stage 1 (Imam Bukhari Stage)',
      date: '2026-09-15',
      startTime: '11:15 AM',
      endTime: '01:00 PM',
      participantLimit: 10,
    },
    {
      name: 'Arabic Song (Group)',
      category: 'Junior',
      stage: 'Stage 3 (Imam Ghazali Stage)',
      date: '2026-09-15',
      startTime: '02:00 PM',
      endTime: '03:30 PM',
      participantLimit: 8,
      isGroup: true,
    },
    {
      name: 'Mawlid Quiz Competition',
      category: 'Senior',
      stage: 'Stage 2 (Imam Shafi Stage)',
      date: '2026-09-15',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      participantLimit: 20,
    },
    {
      name: 'Arabic Calligraphy',
      category: 'Senior',
      stage: 'Hall A (Art Studio)',
      date: '2026-09-15',
      startTime: '03:30 PM',
      endTime: '05:00 PM',
      participantLimit: 15,
    },
    {
      name: 'Grand Naat Recitation',
      category: 'Super Senior',
      stage: 'Main Auditorium (Grand Stage)',
      date: '2026-09-15',
      startTime: '07:00 PM',
      endTime: '09:00 PM',
      participantLimit: 10,
    },
    {
      name: 'Extempore Speech (English)',
      category: 'Super Senior',
      stage: 'Stage 1 (Imam Bukhari Stage)',
      date: '2026-09-15',
      startTime: '04:30 PM',
      endTime: '06:00 PM',
      participantLimit: 8,
    },
    {
      name: 'General Grand Meelad Rally & Procession',
      category: 'General',
      stage: 'Grand Campus Grounds',
      date: '2026-09-15',
      startTime: '08:00 AM',
      endTime: '09:30 AM',
      participantLimit: 50,
    },
    {
      name: 'General Qaseeda Burda Recitation',
      category: 'General',
      stage: 'Main Auditorium (Grand Stage)',
      date: '2026-09-15',
      startTime: '08:30 PM',
      endTime: '10:00 PM',
      participantLimit: 30,
    },
  ];

  const createdProgrammes = [];
  for (const p of sampleProgrammes) {
    const prog = await prisma.programme.create({
      data: p,
    });
    createdProgrammes.push(prog);
  }

  // 5. Schedules tied to programmes
  for (let i = 0; i < createdProgrammes.length; i++) {
    const prog = createdProgrammes[i];
    await prisma.schedule.create({
      data: {
        programmeId: prog.id,
        stage: prog.stage,
        date: prog.date,
        startTime: prog.startTime,
        endTime: prog.endTime,
        status: i === 0 ? 'LIVE' : i < 4 ? 'UPCOMING' : 'UPCOMING',
      },
    });
  }

  // 6. Sample Participants
  const sampleParticipants = [
    {
      registrationId: 'HK2026-0001',
      chestNumber: '101',
      fullName: 'Muhammed Sinan',
      group: 'MAVADDA',
      category: 'Sub Junior',
      gender: 'Male',
      dob: '2016-04-12',
      whatsapp: '9876543210',
      madrasa: 'Mifthahul Uloom Central',
    },
    {
      registrationId: 'HK2026-0002',
      chestNumber: '301',
      fullName: 'Ahmed Zayan',
      group: 'MAHABBA',
      category: 'Sub Junior',
      gender: 'Male',
      dob: '2015-08-20',
      whatsapp: '9876543211',
      madrasa: 'Al-Huda Islamic Complex',
    },
    {
      registrationId: 'HK2026-0003',
      chestNumber: '102',
      fullName: 'Fatima Naha',
      group: 'MAVADDA',
      category: 'Junior',
      gender: 'Female',
      dob: '2013-02-15',
      whatsapp: '9876543212',
      madrasa: 'Mifthahul Uloom North',
    },
    {
      registrationId: 'HK2026-0004',
      chestNumber: '302',
      fullName: 'Muhammed Bilal',
      group: 'MAHABBA',
      category: 'Senior',
      gender: 'Male',
      dob: '2010-11-05',
      whatsapp: '9876543213',
      madrasa: 'Bustanul Uloom Academy',
    },
    {
      registrationId: 'HK2026-0005',
      chestNumber: '103',
      fullName: 'Umer Abdullah',
      group: 'MAVADDA',
      category: 'Super Senior',
      gender: 'Male',
      dob: '2008-01-30',
      whatsapp: '9876543214',
      madrasa: 'Mifthahul Uloom Central',
    },
  ];

  const createdParticipants = [];
  for (const part of sampleParticipants) {
    const createdPart = await prisma.participant.create({ data: part });
    createdParticipants.push(createdPart);
  }

  // Register participants in some programmes
  if (createdParticipants.length > 0 && createdProgrammes.length > 0) {
    await prisma.registration.create({
      data: {
        participantId: createdParticipants[0].id,
        programmeId: createdProgrammes[0].id,
      },
    });
    await prisma.registration.create({
      data: {
        participantId: createdParticipants[1].id,
        programmeId: createdProgrammes[0].id,
      },
    });
    await prisma.registration.create({
      data: {
        participantId: createdParticipants[2].id,
        programmeId: createdProgrammes[2].id,
      },
    });
  }

  // 7. Results
  if (createdParticipants.length >= 3 && createdProgrammes.length > 0) {
    await prisma.result.create({
      data: {
        programmeId: createdProgrammes[0].id,
        participantId: createdParticipants[0].id,
        position: '1st Place',
        points: 10,
        certificateGenerated: true,
      },
    });
    await prisma.result.create({
      data: {
        programmeId: createdProgrammes[0].id,
        participantId: createdParticipants[1].id,
        position: '2nd Place (Grade A)',
        points: 7,
        certificateGenerated: true,
      },
    });
  }

  // 8. Announcements
  const announcements = [
    {
      title: 'Grand Inauguration & Meelad Rally Schedule Released',
      body: 'We are thrilled to announce the official schedule for Husnul Kamal Meelad Fest 2026! The inaugural rally will commence from Ullisherikkunnu Junction at 08:00 AM on September 15th.',
      categoryBadge: 'Fest News',
    },
    {
      title: 'Participant Chest Numbers & ID Card Downloads Active',
      body: 'All registered delegates can now check their assigned Chest Numbers under the Results & Registration portal. ID cards are printable with official QR verification code.',
      categoryBadge: 'Schedule Update',
    },
    {
      title: 'Rules & Guidelines for Stage Competitions',
      body: 'Delegates must report at least 15 minutes before their scheduled stage time. Evaluation criteria include Tajweed, Tone, Expressions, and Time Adherence.',
      categoryBadge: 'Rules',
    },
  ];

  for (const ann of announcements) {
    await prisma.announcement.create({ data: ann });
  }

  // 9. Gallery Albums & Photos
  const album1 = await prisma.galleryAlbum.create({
    data: {
      title: 'Meelad Fest Pre-Event Celebrations',
      coverImage: 'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=800&q=80',
    },
  });

  const album2 = await prisma.galleryAlbum.create({
    data: {
      title: 'Qirat & Calligraphy Exhibition',
      coverImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    },
  });

  await prisma.galleryPhoto.createMany({
    data: [
      { albumId: album1.id, imageUrl: 'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&w=800&q=80' },
      { albumId: album1.id, imageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80' },
      { albumId: album2.id, imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
      { albumId: album2.id, imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80' },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
