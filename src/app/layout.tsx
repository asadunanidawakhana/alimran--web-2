import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ToastNotification';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Al Imran Tense Learner',
  description: 'Master English Tenses',
  manifest: '/manifest.json',
};

import ThemeWrapper from '@/components/ThemeWrapper';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-background text-foreground min-h-screen flex justify-center selection:bg-primary selection:text-white font-inter">
        <ThemeWrapper>
          {children}
          <ToastContainer />
        </ThemeWrapper>
      </body>
    </html>
  );
}
