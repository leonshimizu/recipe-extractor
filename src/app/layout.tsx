import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { PWAProvider } from '@/components/providers/pwa-provider';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DesktopSidebar } from '@/components/layout/desktop-sidebar';
import { Toaster } from '@/components/ui/sonner';
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '🍳 Recipe Extractor',
  description: 'Extract structured recipes from video URLs',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Recipe Extractor',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ServiceWorkerRegister />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PWAProvider>
            <div className="min-h-screen bg-background">
              <DesktopSidebar />
              <main className="pb-16 md:pb-0 md:pl-64">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {children}
                </div>
              </main>
              <MobileNav />
            </div>
            <Toaster />
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
