const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const progs = await prisma.programme.findMany({
    select: { name: true, participantLimit: true, registrations: { select: { id: true } } }
  });
  console.log(progs.map(p => `${p.name} - Limit: ${p.participantLimit} - Regs: ${p.registrations.length}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
