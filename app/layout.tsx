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
        <link rel="stylesheet" href="https://jehlp.net/site-theme/v2/base.css?v=20260930-mobile-header" />
      </head>
      <body>
      <a className="skip-link" href="#puzzle">Skip to puzzle</a>
      <header className="site-header site-header--identity">
        <div className="site-brand"><img className="site-mark" src="https://jehlp.net/site-theme/v2/marks/box-puzzles.png" width="32" height="32" alt="" /><span className="site-title">Box Logic</span></div>
        <nav aria-label="Site links">
          <span className="site-utility-pair"><a className="site-home" href="https://jehlp.net/" aria-label="Home — jehlp.net" title="Home — jehlp.net"><span aria-hidden="true">✳</span></a><button className="theme-toggle" type="button" data-theme-toggle aria-label="Use dark theme" aria-pressed="false">◐</button></span>
        </nav>
      </header>
        {children}
      </body>
    </html>
  );
}
