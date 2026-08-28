import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const source = await readFile(new URL('../src/PuzzleApp.tsx', import.meta.url), 'utf8');

test('static page uses jehlp.net metadata, shared theme, and its own favicon', () => {
  assert.match(html, /https:\/\/jehlp\.net\/box-puzzles\//);
  assert.match(html, /site-theme\/v2\/base\.css/);
  assert.match(source, /site-theme\/v2\/theme\.js/);
  assert.match(html, /favicons\/box-puzzles\.png/);
  assert.doesNotMatch(html, /og:image|twitter:image|summary_large_image|og\.png/);
  assert.doesNotMatch(source, /images:\s*\[|summary_large_image|og\.png/);
  assert.doesNotMatch(html, />\s*JWKNT\s*</i);
});

test('interface exposes generation, answer, explanation, and certificate controls', () => {
  assert.match(source, /type="range" min="2" max="8"/);
  assert.match(source, />New puzzle</);
  assert.match(source, />Check answer</);
  assert.match(source, />Reveal</);
  assert.match(source, /All valid cases agree/);
  assert.match(source, /Lean certificate/);
  assert.match(source, /Normalized statements/);
});
