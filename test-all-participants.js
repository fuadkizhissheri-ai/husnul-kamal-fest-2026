const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.participant.findMany();
  console.log(p.map(x => x.registrationId));
}

main().catch(console.error).finally(() => prisma.$disconnect());
