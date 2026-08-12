const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pCount = await prisma.participant.count();
  const rCount = await prisma.registration.count();
  console.log("Total Participants:", pCount);
  console.log("Total Registrations:", rCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
