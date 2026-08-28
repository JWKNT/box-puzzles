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
  assert.match(source, />Rules</);
  assert.match(source, /Exactly one box contains the gem/);
  assert.match(source, /The inscriptions uniquely determine both the gem box and every liar box/);
  assert.doesNotMatch(source, /may differ between valid cases/);
  assert.doesNotMatch(source, /One gem\. One false inscription\. Which box is forced\?/);
  assert.match(source, /id="box-count" type="range" min="2" max="16"/);
  assert.match(source, /id="liar-count" type="range" min="1"/);
  assert.match(source, />New puzzle</);
  assert.match(source, />Load seed</);
  assert.match(source, />Check answer</);
  assert.match(source, />Reveal</);
  assert.match(source, /All valid cases agree/);
  assert.match(source, /Lean certificate/);
  assert.match(source, /Normalized statements/);
});
