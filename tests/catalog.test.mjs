import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(await readFile(new URL('../public/puzzles.json', import.meta.url), 'utf8'));

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
  const maskLimit = 2 ** puzzle.boxCount;
  for (let mask = 0; mask < maskLimit; mask += 1) {
    if (bitCount(mask) !== puzzle.liarCount) continue;
    const liars = Array.from({ length: puzzle.boxCount }, (_, box) => box)
      .filter((box) => (mask & (2 ** box)) !== 0);
    for (let gem = 0; gem < puzzle.boxCount; gem += 1) {
      const world = { gem, liars };
      const valid = puzzle.boxes.every((box) =>
        evaluate(box.ast, world) === !isLiar(world, box.id));
      if (valid) worlds.push(world);
    }
  }
  return worlds;
};

test('catalog covers every supported box and liar count', () => {
  assert.equal(catalog.schema, 2);
  assert.equal(catalog.puzzles.length, 480);
  for (let boxCount = 2; boxCount <= 16; boxCount += 1) {
    for (let liarCount = 1; liarCount < boxCount; liarCount += 1) {
      assert.equal(
        catalog.puzzles.filter((puzzle) =>
          puzzle.boxCount === boxCount && puzzle.liarCount === liarCount).length,
        4,
        `${boxCount} boxes, ${liarCount} liars`,
      );
    }
  }
});

test('every exported puzzle has exactly one certified solution', () => {
  for (const puzzle of catalog.puzzles) {
    assert.equal(puzzle.worlds.length, 1, `${puzzle.id}: one valid world`);
    assert.deepEqual(puzzle.worlds[0], { gem: puzzle.gem, liars: puzzle.liars }, `${puzzle.id}: witness`);
    assert.equal(puzzle.liars.length, puzzle.liarCount, `${puzzle.id}: liar count`);
    assert.equal(new Set(puzzle.liars).size, puzzle.liarCount, `${puzzle.id}: distinct liars`);
    assert.ok(puzzle.boxes.every((box) =>
      evaluate(box.ast, puzzle.worlds[0]) === !isLiar(puzzle.worlds[0], box.id)), `${puzzle.id}: valid witness`);
  }
});

test('an independent evaluator rejects ambiguous gems and liar sets', () => {
  for (let boxCount = 2; boxCount <= 16; boxCount += 1) {
    for (let liarCount = 1; liarCount < boxCount; liarCount += 1) {
      const puzzle = catalog.puzzles.find((entry) =>
        entry.boxCount === boxCount && entry.liarCount === liarCount);
      assert.deepEqual(models(puzzle), puzzle.worlds, `${puzzle.id}: exhaustive models`);
    }
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

test('seeds identify puzzles within each box and liar setting', () => {
  for (let boxCount = 2; boxCount <= 16; boxCount += 1) {
    for (let liarCount = 1; liarCount < boxCount; liarCount += 1) {
      const puzzles = catalog.puzzles.filter((entry) =>
        entry.boxCount === boxCount && entry.liarCount === liarCount);
      assert.equal(new Set(puzzles.map((puzzle) => puzzle.seed)).size, puzzles.length);
    }
  }
});
