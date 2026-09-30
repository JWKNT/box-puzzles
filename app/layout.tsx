import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Box Logic · jehlp.net',
  description: 'Seeded box puzzles generated and exhaustively checked on demand.',
  metadataBase: new URL('https://jehlp.net/box-puzzles/'),
  alternates: { canonical: './' },
  icons: { icon: 'https://jehlp.net/site-theme/v2/favicons/box-puzzles.png' },
  openGraph: {
    title: 'Box Logic · jehlp.net',
    description: 'Seeded box puzzles generated and exhaustively checked on demand.',
    url: './',
    siteName: 'jehlp.net',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Box Logic · jehlp.net',
    description: 'Seeded box puzzles generated and exhaustively checked on demand.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://jehlp.net/site-theme/v2/base.css?v=20260930-home" />
      </head>
      <body>
        <nav className="site-home-dock" aria-label="Site"><a className="site-home" href="https://jehlp.net/" aria-label="Home · jehlp.net" title="Home · jehlp.net"><span aria-hidden="true">⌂</span></a></nav>
        {children}
      </body>
    </html>
  );
}
