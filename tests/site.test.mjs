import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const source = await readFile(new URL('../src/PuzzleApp.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('static page uses jehlp.net metadata, shared theme, and its own favicon', () => {
  assert.match(html, /https:\/\/jehlp\.net\/box-puzzles\//);
  assert.match(html, /generated and exhaustively checked on demand/);
  assert.match(source, /liarCount/);
  assert.match(html, /site-theme\/v2\/base\.css/);
  assert.match(source, /site-theme\/v2\/theme\.js/);
  assert.match(html, /favicons\/box-puzzles\.png/);
  assert.doesNotMatch(html, /og:image|twitter:image|summary_large_image|og\.png/);
  assert.doesNotMatch(source, /images:\s*\[|summary_large_image|og\.png/);
  assert.doesNotMatch(html, />\s*JWKNT\s*</i);
  assert.doesNotMatch(source, /<a\b[^>]*href="https:\/\/jehlp\.net\/?"/);
  assert.match(source, /className="site-mark" aria-hidden="true"/);
});

test('interface exposes generation, answer, explanation, and certificate controls', () => {
  assert.match(source, /<h1 className="sr-only" id="page-title">Box logic<\/h1>/);
  assert.doesNotMatch(source, /<h1 id="page-title">Box logic<\/h1>/);
  assert.match(source, /className="puzzle-setup"/);
  assert.match(source, />Rules</);
  assert.match(source, /Exactly one box contains the gem/);
  assert.match(source, /Each inscription is evaluated as one complete statement/);
  assert.match(source, /If a false inscription says “A or B,” then both A and B are false/);
  assert.match(source, /The inscriptions uniquely determine both the gem box and every liar box/);
  assert.doesNotMatch(source, /may differ between valid cases/);
  assert.doesNotMatch(source, /One gem\. One false inscription\. Which box is forced\?/);
  assert.match(source, /id="box-count" type="range" min="2" max="16"/);
  assert.match(source, /id="liar-count" type="range" min="1"/);
  assert.match(source, /Generate puzzle/);
  assert.match(source, />Load seed</);
  assert.match(source, />Check answer</);
  assert.match(source, />Reveal</);
  assert.doesNotMatch(source, /The unique valid case/);
  assert.match(source, /className="box-verdict"/);
  assert.match(source, /isFalse \? 'False' : 'True'/);
  assert.match(source, /verdict-badge is-gem/);
  assert.match(source, /className="solution-panel"/);
  assert.match(source, /box contains the gem/);
  assert.match(source, /Lean proof source/);
  assert.match(source, /Normalized statements/);
  assert.doesNotMatch(source, /fetch\(['"]\.\/puzzles\.json/);
});

test('box cards use equal-height grid tracks and stretch their bodies', () => {
  assert.match(css, /\.boxes \{[^}]*grid-auto-rows: 1fr/);
  assert.match(css, /\.box \{[^}]*display: flex[^}]*flex-direction: column/);
  assert.match(css, /\.box-body \{[^}]*flex: 1/);
});
