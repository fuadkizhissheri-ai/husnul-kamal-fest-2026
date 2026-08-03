import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ── Fonts with display:swap so text renders immediately in fallback ──
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Husnul Kamal — Meelad Fest 2026 | Official Event Portal',
  description:
    'Official event portal for Husnul Kamal Meelad Fest 2026 hosted by Mifthahul Uloom Madrasa, Ullisherikkunnu. Delegate registrations, live scoreboards, schedules, announcements, and certificates.',
  keywords: ['Husnul Kamal', 'Meelad Fest 2026', 'Mifthahul Uloom', 'Ullisherikkunnu', 'Islamic Festival'],
  // Performance: tell browser to preconnect to Google Fonts CDN
  other: {
    'theme-color': '#C8A86B',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${inter.variable} dark`}>
      <head>
        {/* DNS prefetch + preconnect for Google Fonts (fonts already inlined by next/font but keeps cross-origin ready) */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Google Fonts for Certificate PDF & JPEG Rendering */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Montserrat:wght@400;600;700;800;900&display=swap" />

        {/* Preload hint for the API that every page needs on mount */}
        <link rel="preload" href="/api/settings" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#F8F8F8] text-[#0B0B0B] dark:bg-[#0B0B0B] dark:text-[#FFFFFF] min-h-screen flex flex-col font-sans antialiased selection:bg-[#C8A86B] selection:text-[#0B0B0B]">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">
            <ErrorBoundary fallbackTitle="Page failed to load">
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
