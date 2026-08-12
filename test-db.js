const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.setting.findMany();
  console.log(JSON.stringify(settings, null, 2));
}

main().finally(() => prisma.$disconnect());
