import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.husnulkamal.app',
  appName: 'Husnul Kamal',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    url: 'https://husnul-kamal-fest-2026.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
