import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LATE KISHAN BARAIYA(PAJI) HOCKEY CHAMPIONSHIP | Official Platform',
  description:
    'Official tournament management platform for Late Kishan Baraiya(Paji) Hockey Championship — Amreli, Gujarat, India. Live scores, fixtures, field hockey standings, top scorers, and knockout brackets.',
  keywords: [
    'Amreli Hockey',
    '7-Side Hockey',
    'Field Hockey Gujarat',
    'Amreli Tournament',
    'Hockey Standings',
    'Hockey Scores',
  ],
  openGraph: {
    title: 'LATE KISHAN BARAIYA(PAJI) HOCKEY CHAMPIONSHIP',
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
        <Analytics />
      </body>
    </html>
  );
}
