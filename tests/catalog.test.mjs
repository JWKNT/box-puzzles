import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(await readFile(new URL('../public/puzzles.json', import.meta.url), 'utf8'));

const evaluate = (formula, world) => {
  switch (formula.type) {
    case 'gemAt': return world.gem === formula.box;
    case 'liarAt': return world.liar === formula.box;
    case 'truthfulAt': return world.liar !== formula.box;
    case 'gemIsLiar': return world.gem === world.liar;
    case 'not': return !evaluate(formula.value, world);
    case 'and': return evaluate(formula.left, world) && evaluate(formula.right, world);
    case 'or': return evaluate(formula.left, world) || evaluate(formula.right, world);
    case 'xor': return evaluate(formula.left, world) !== evaluate(formula.right, world);
    case 'iff': return evaluate(formula.left, world) === evaluate(formula.right, world);
    case 'implies': return !evaluate(formula.left, world) || evaluate(formula.right, world);
    default: throw new Error(`unknown formula ${formula.type}`);
  }
};

const models = (puzzle) => {
  const worlds = [];
  for (let gem = 0; gem < puzzle.boxCount; gem += 1) {
    for (let liar = 0; liar < puzzle.boxCount; liar += 1) {
      const world = { gem, liar };
      const valid = puzzle.boxes.every((box) => evaluate(box.ast, world) === (box.id !== liar));
      if (valid) worlds.push(world);
    }
  }
  return worlds;
};

test('catalog covers every requested box count evenly', () => {
  assert.equal(catalog.schema, 1);
  assert.equal(catalog.puzzles.length, 168);
  for (let count = 2; count <= 8; count += 1) {
    assert.equal(catalog.puzzles.filter((puzzle) => puzzle.boxCount === count).length, 24);
  }
});

test('every exported puzzle independently has a model and a unique gem', () => {
  for (const puzzle of catalog.puzzles) {
    const computed = models(puzzle);
    assert.deepEqual(computed, puzzle.worlds, `${puzzle.id}: exported models`);
    assert.ok(computed.length > 0, `${puzzle.id}: has a model`);
    assert.deepEqual([...new Set(computed.map((world) => world.gem))], [puzzle.gem], `${puzzle.id}: unique gem`);
    assert.deepEqual([...new Set(computed.map((world) => world.liar))], puzzle.possibleLiars, `${puzzle.id}: possible liars`);
  }
});

test('statements and box identities remain readable and distinct', () => {
  for (const puzzle of catalog.puzzles) {
    assert.equal(puzzle.boxes.length, puzzle.boxCount);
    assert.equal(new Set(puzzle.boxes.map((box) => box.statement)).size, puzzle.boxCount, `${puzzle.id}: statement text`);
    assert.equal(new Set(puzzle.boxes.map((box) => box.name)).size, puzzle.boxCount, `${puzzle.id}: names`);
    assert.equal(new Set(puzzle.boxes.map((box) => box.color)).size, puzzle.boxCount, `${puzzle.id}: colors`);
    assert.ok(puzzle.boxes.every((box) => box.statement.length <= 180), `${puzzle.id}: statement length`);
  }
});

test('the supplied two-box example is preserved exactly', () => {
  const example = catalog.puzzles.find((puzzle) => puzzle.id === 'bp-2-0');
  assert.deepEqual(example.boxes.map((box) => box.statement), [
    'This box is telling the truth.',
    'The lying box contains the gem.',
  ]);
  assert.equal(example.gem, 0);
  assert.deepEqual(example.possibleLiars, [0, 1]);
});
