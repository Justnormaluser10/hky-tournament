import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AMRELI 1st HOCKEY 7-SIDE TOURNAMENT | Official Platform',
  description:
    'Official tournament management platform for Amreli 1st Hockey 7-Side Tournament — Amreli, Gujarat, India. Live scores, fixtures, field hockey standings, top scorers, and knockout brackets.',
  keywords: [
    'Amreli Hockey',
    '7-Side Hockey',
    'Field Hockey Gujarat',
    'Amreli Tournament',
    'Hockey Standings',
    'Hockey Scores',
  ],
  openGraph: {
    title: 'AMRELI 1st HOCKEY 7-SIDE TOURNAMENT',
    description: 'Where Competition Meets Glory — Amreli, Gujarat, India.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
