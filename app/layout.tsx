import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { ChunkLoadErrorHandler } from '@/components/ChunkLoadErrorHandler';

export const metadata: Metadata = {
  title: 'Dashwar — USA/Israel–Iran Conflict Information',
  description:
    'Real-time aggregation of conflict-related news, statements, and events with source attribution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ChunkLoadErrorHandler />
        <LocaleProvider>
          <Header />
          <main className="main">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
