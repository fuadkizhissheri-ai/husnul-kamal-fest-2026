const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.setting.findUnique({ where: { key: 'committee_members' } });
  let members = JSON.parse(setting.value);
  
  // Update broken URLs
  members = members.map(m => {
    if (m.photoUrl && m.photoUrl.includes('2-omega-flame.vercel.app/uploads')) {
       // Replace with a beautiful initials avatar
       m.photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=18181B&color=C8A86B&size=256&bold=true`;
    }
    return m;
  });
  
  await prisma.setting.update({
    where: { key: 'committee_members' },
    data: { value: JSON.stringify(members) }
  });
  
  console.log("Fixed members:", members);
}
main().finally(() => prisma.$disconnect());
