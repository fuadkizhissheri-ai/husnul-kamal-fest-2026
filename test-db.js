const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const setting = await prisma.setting.findUnique({ where: { key: 'committee_members' } });
  console.log(setting.value);
}
main().finally(() => prisma.$disconnect());
