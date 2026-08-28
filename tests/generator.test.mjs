import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import test from 'node:test';
import { generatePuzzle } from '../src/puzzleGenerator.mjs';

const fixtures = [
  { boxCount: 2, liarCount: 1, seed: 0, attempt: 3, gem: 1, liars: [1] },
  { boxCount: 4, liarCount: 2, seed: 42, attempt: 4, gem: 3, liars: [1, 2] },
  { boxCount: 8, liarCount: 3, seed: 123, attempt: 10, gem: 1, liars: [0, 1, 7] },
  { boxCount: 12, liarCount: 6, seed: 1, attempt: 3, gem: 6, liars: [2, 3, 4, 5, 6, 7] },
  { boxCount: 16, liarCount: 8, seed: 3, attempt: 88, gem: 0, liars: [4, 5, 6, 7, 8, 9, 10, 11] },
  { boxCount: 16, liarCount: 15, seed: 4, attempt: 136, gem: 6, liars: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15] },
];

const isLiar = (world, box) => world.liars.includes(box);

const evaluate = (formula, world) => {
  switch (formula.type) {
    case 'gemAt': return world.gem === formula.box;
    case 'liarAt': return isLiar(world, formula.box);
    case 'truthfulAt': return !isLiar(world, formula.box);
    case 'gemIsLiar': return isLiar(world, world.gem);
    case 'not': return !evaluate(formula.value, world);
    case 'and': return evaluate(formula.left, world) && evaluate(formula.right, world);
    case 'or': return evaluate(formula.left, world) || evaluate(formula.right, world);
    case 'xor': return evaluate(formula.left, world) !== evaluate(formula.right, world);
    case 'iff': return evaluate(formula.left, world) === evaluate(formula.right, world);
    case 'implies': return !evaluate(formula.left, world) || evaluate(formula.right, world);
    default: throw new Error(`unknown formula ${formula.type}`);
  }
};

const bitCount = (value) => {
  let count = 0;
  for (let bits = value; bits !== 0; bits >>>= 1) count += bits & 1;
  return count;
};

const models = (puzzle) => {
  const worlds = [];
  for (let mask = 0; mask < 2 ** puzzle.boxCount; mask += 1) {
    if (bitCount(mask) !== puzzle.liarCount) continue;
    const liars = Array.from({ length: puzzle.boxCount }, (_, box) => box)
      .filter((box) => (mask & (2 ** box)) !== 0);
    for (let gem = 0; gem < puzzle.boxCount; gem += 1) {
      const world = { gem, liars };
      if (puzzle.boxes.every((box) => evaluate(box.ast, world) === !isLiar(world, box.id))) {
        worlds.push(world);
      }
    }
  }
  return worlds;
};

test('generation is deterministic for every supported scale', () => {
  for (const fixture of fixtures) {
    const first = generatePuzzle(fixture.boxCount, fixture.liarCount, fixture.seed);
    const second = generatePuzzle(fixture.boxCount, fixture.liarCount, fixture.seed);
    assert.deepEqual(first, second);
    assert.equal(first.attempt, fixture.attempt);
    assert.equal(first.gem, fixture.gem);
    assert.deepEqual(first.liars, fixture.liars);
  }
});

test('an independent evaluator finds exactly one gem and liar assignment', () => {
  for (const fixture of fixtures) {
    const puzzle = generatePuzzle(fixture.boxCount, fixture.liarCount, fixture.seed);
    assert.deepEqual(models(puzzle), puzzle.worlds, puzzle.id);
    assert.equal(puzzle.worlds.length, 1);
  }
});

test('generated statements and box identities are readable and distinct', () => {
  for (const fixture of fixtures) {
    const puzzle = generatePuzzle(fixture.boxCount, fixture.liarCount, fixture.seed);
    assert.equal(puzzle.boxes.length, puzzle.boxCount);
    assert.equal(new Set(puzzle.boxes.map((box) => box.statement)).size, puzzle.boxCount);
    assert.equal(new Set(puzzle.boxes.map((box) => box.name)).size, puzzle.boxCount);
    assert.equal(new Set(puzzle.boxes.map((box) => box.color)).size, puzzle.boxCount);
    assert.ok(puzzle.boxes.every((box) => box.statement.length <= 180));
  }
});

test('the site ships no prebuilt puzzle catalog', async () => {
  await assert.rejects(access(new URL('../public/puzzles.json', import.meta.url)));
});

test('invalid settings and seeds are rejected', () => {
  assert.equal(generatePuzzle(1, 1, 0), null);
  assert.equal(generatePuzzle(17, 1, 0), null);
  assert.equal(generatePuzzle(4, 0, 0), null);
  assert.equal(generatePuzzle(4, 4, 0), null);
  assert.equal(generatePuzzle(4, 1, -1), null);
  assert.equal(generatePuzzle(4, 1, 0x100000000), null);
});
