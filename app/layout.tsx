import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Box Logic · jehlp.net',
  description: 'Lean-verified one-liar box puzzles with a uniquely determined gem.',
  metadataBase: new URL('https://jehlp.net/box-puzzles/'),
  alternates: { canonical: './' },
  icons: { icon: 'https://jehlp.net/site-theme/v2/favicons/box-puzzles.png' },
  openGraph: {
    title: 'Box Logic · jehlp.net',
    description: 'Lean-verified one-liar box puzzles with a uniquely determined gem.',
    url: './',
    siteName: 'jehlp.net',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Box Logic · jehlp.net',
    description: 'Lean-verified one-liar box puzzles with a uniquely determined gem.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://jehlp.net/site-theme/v2/base.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
