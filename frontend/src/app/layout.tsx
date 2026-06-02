import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-mono',
  display:  'swap',
});

export const metadata: Metadata = {
  title: {
    default:  process.env.NEXT_PUBLIC_SITE_NAME || 'AI Blog CMS',
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || 'AI Blog CMS'}`,
  },
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'A modern AI-powered blog platform built with Strapi and Next.js',
  keywords:    ['Strapi', 'Next.js', 'Blog', 'CMS', 'AI', 'PostgreSQL', 'Docker'],
  authors:     [{ name: 'AI Blog CMS Team' }],
  creator:     'AI Blog CMS',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type:      'website',
    locale:    'en_US',
    siteName:  process.env.NEXT_PUBLIC_SITE_NAME || 'AI Blog CMS',
    images:    [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card:    'summary_large_image',
    creator: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@aiblogcms',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  verification: {
    google: 'your-google-site-verification',
  },
};

export const viewport: Viewport = {
  themeColor:  '#6366f1',
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
