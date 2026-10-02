import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsxEmit, ModuleKind, transpileModule } from 'typescript';
import { generatePuzzle } from '../src/puzzleGenerator.mjs';

const source = await readFile(new URL('../src/PuzzleApp.tsx', import.meta.url), 'utf8');
const moduleUrl = (text) => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;

// Render the actual component with deterministic initial puzzle data. Browser
// effects do not run during server rendering, so no DOM or storage mocks are needed.
const renderPuzzle = async (puzzle) => {
  const generator = moduleUrl(`export const generatePuzzle = () => (${JSON.stringify(puzzle)});`);
  let compiled = transpileModule(source, {
    compilerOptions: { module: ModuleKind.ESNext, jsx: JsxEmit.ReactJSX },
  }).outputText;
  for (const [original, replacement] of [
    ['react', import.meta.resolve('react')],
    ['react/jsx-runtime', import.meta.resolve('react/jsx-runtime')],
    ['./puzzleGenerator.mjs', generator],
  ]) {
    compiled = compiled.replaceAll(`from '${original}'`, `from '${replacement}'`)
      .replaceAll(`from "${original}"`, `from "${replacement}"`);
  }
  const { default: PuzzleApp } = await import(moduleUrl(compiled));
  return renderToStaticMarkup(createElement(PuzzleApp));
};

test('a valid gem index of zero renders its box and certificate', async () => {
  const puzzle = generatePuzzle(2, 1, 2);
  assert.equal(puzzle.gem, 0);
  const html = await renderPuzzle(puzzle);
  assert.match(html, /class="puzzle-fieldset"/);
  assert.match(html, /name="gem-box" value="0"/);
  assert.match(html, /<dt>Forced gem<\/dt><dd>red<\/dd>/);
});

test('missing gem data cannot render an unsafe certificate', async () => {
  const puzzle = generatePuzzle(2, 1, 2);
  const html = await renderPuzzle({ ...puzzle, gem: puzzle.boxes.length });
  assert.match(html, /id="rules-title"/);
  assert.doesNotMatch(html, /class="puzzle-fieldset"|class="certificate"/);
});

test('an absent puzzle retains the seed-generation fallback', async () => {
  const html = await renderPuzzle(null);
  assert.match(html, /id="standalone-seed-input"/);
  assert.match(html, /Generate from seed/);
  assert.doesNotMatch(html, /class="puzzle-fieldset"|class="certificate"/);
});
