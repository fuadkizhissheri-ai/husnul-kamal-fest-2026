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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://husnul-kamal-fest-2026.vercel.app');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Husnul Kamal Meelad Fest 2026 | Mifthahul Uloom Madrasa',
  description:
    'Mifthahul Uloom Madrasa Ullisherikkunnu proudly presents Husnul Kamal Meelad Fest 2026.',
  keywords: ['Husnul Kamal', 'Meelad Fest 2026', 'Mifthahul Uloom', 'Ullisherikkunnu', 'Grand Meelad', 'Islamic Festival'],
  openGraph: {
    title: 'Husnul Kamal Meelad Fest 2026 | Mifthahul Uloom Madrasa',
    description: 'Mifthahul Uloom Madrasa Ullisherikkunnu proudly presents Husnul Kamal Meelad Fest 2026.',
    url: siteUrl,
    siteName: 'Husnul Kamal Meelad Fest 2026',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Husnul Kamal Meelad Fest 2026 Logo Banner',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Husnul Kamal Meelad Fest 2026 | Mifthahul Uloom Madrasa',
    description: 'Mifthahul Uloom Madrasa Ullisherikkunnu proudly presents Husnul Kamal Meelad Fest 2026.',
    images: [`${siteUrl}/og-image.png`],
  },
  other: {
    'theme-color': '#C8A86B',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${inter.variable} dark`}>
      <head>
        {/* Open Graph & Twitter Meta Tags for WhatsApp and Social Link Preview Scrapers */}
        <meta property="og:title" content="Husnul Kamal Meelad Fest 2026 | Mifthahul Uloom Madrasa" />
        <meta property="og:description" content="Mifthahul Uloom Madrasa Ullisherikkunnu proudly presents Husnul Kamal Meelad Fest 2026." />
        <meta property="og:image" content={`${siteUrl}/og-image.png`} />
        <meta property="og:image:secure_url" content={`${siteUrl}/og-image.png`} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Husnul Kamal Meelad Fest 2026" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Husnul Kamal Meelad Fest 2026 | Mifthahul Uloom Madrasa" />
        <meta name="twitter:description" content="Mifthahul Uloom Madrasa Ullisherikkunnu proudly presents Husnul Kamal Meelad Fest 2026." />
        <meta name="twitter:image" content={`${siteUrl}/og-image.png`} />
        {/* DNS prefetch + preconnect for Google Fonts (fonts already inlined by next/font but keeps cross-origin ready) */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Google Fonts for Web Header & Certificate PDF & JPEG Rendering */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Montserrat:wght@400;600;700;800;900&display=swap" />

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
