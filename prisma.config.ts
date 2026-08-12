import { defineConfig } from '@prisma/config';

export default defineConfig({
  earlyAccess: true,
  seed: 'npx tsx prisma/seed.ts',
});
