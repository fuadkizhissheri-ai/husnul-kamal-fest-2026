const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const progs = await prisma.programme.findMany({
    where: { name: 'MEMORY TEST' },
    include: {
      registrations: {
        include: { participant: true }
      }
    }
  });

  progs.forEach(prog => {
    console.log(`Programme: ${prog.name} (${prog.category}) - (Limit: ${prog.participantLimit})`);
    prog.registrations.forEach(r => {
      console.log(`- ${r.participant.fullName} (${r.participant.group}, ${r.participant.gender}, ${r.participant.category})`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
