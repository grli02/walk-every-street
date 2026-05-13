import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Walk Every Street',
  description: 'Track which streets you have walked in Frederiksberg',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
