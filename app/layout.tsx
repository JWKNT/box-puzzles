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
    images: [{ url: 'og.png', width: 1731, height: 909, alt: 'Box Logic puzzle boxes and a gem' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Box Logic · jehlp.net',
    description: 'Lean-verified one-liar box puzzles with a uniquely determined gem.',
    images: ['og.png'],
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
