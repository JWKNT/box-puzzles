/** @typedef {{ type: string, box?: number, value?: Formula, left?: Formula, right?: Formula }} Formula */
/** @typedef {{ gem: number, liarMask: number }} InternalWorld */

export const names = [
  'red', 'blue', 'green', 'gold', 'violet', 'teal', 'orange', 'slate',
  'rose', 'cyan', 'olive', 'amber', 'indigo', 'mint', 'coral', 'gray',
];

export const colors = [
  '#a33b32', '#3f6597', '#3d795c', '#9a721c', '#6d5490', '#287982', '#b35f2f', '#5e6672',
  '#ad536b', '#2386a1', '#6f762b', '#b27a24', '#4e58a0', '#3f8b78', '#bd604f', '#777777',
];

export const letters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
];

const MAX_ATTEMPTS = 4000;
const MIX_MODULUS = 2147483647;

const mix = (seed, attempt, speaker, salt) => (
  seed * 104729 + attempt * 13007 + speaker * 7919 + salt * 1543
  + seed * attempt * 37 + speaker * salt * 11 + speaker * speaker * 101
) % MIX_MODULUS;

const boxIndex = (boxCount, code) => code % boxCount;

/** @returns {Formula} */
const formulaForCode = (boxCount, speaker, code) => {
  const first = boxIndex(boxCount, Math.floor(code / 7) + speaker);
  const second = boxIndex(boxCount, Math.floor(code / 43) + speaker + 1);
  const gemFirst = { type: 'gemAt', box: first };
  const gemSecond = { type: 'gemAt', box: second };
  const liarFirst = { type: 'liarAt', box: first };
  const truthFirst = { type: 'truthfulAt', box: first };
  const truthSecond = { type: 'truthfulAt', box: second };
  const liarGem = { type: 'gemIsLiar' };
  switch (code % 18) {
    case 0: return gemFirst;
    case 1: return { type: 'not', value: gemFirst };
    case 2: return liarFirst;
    case 3:
    case 4: return truthFirst;
    case 5: return liarFirst;
    case 6: return liarGem;
    case 7: return { type: 'not', value: liarGem };
    case 8: return { type: 'and', left: gemFirst, right: truthSecond };
    case 9: return { type: 'or', left: gemFirst, right: gemSecond };
    case 10: return { type: 'xor', left: gemFirst, right: truthSecond };
    case 11: return { type: 'iff', left: gemFirst, right: liarFirst };
    case 12: return { type: 'implies', left: truthFirst, right: gemSecond };
    case 13: return { type: 'iff', left: truthFirst, right: truthSecond };
    case 14: return { type: 'xor', left: liarFirst, right: gemSecond };
    case 15: return { type: 'or', left: liarFirst, right: truthSecond };
    case 16: return { type: 'and', left: { type: 'not', value: gemFirst }, right: truthSecond };
    default: return { type: 'implies', left: liarFirst, right: gemSecond };
  }
};

/** @param {Formula} formula @returns {Formula} */
const negated = (formula) => {
  if (formula.type === 'liarAt') return { type: 'truthfulAt', box: formula.box };
  if (formula.type === 'truthfulAt') return { type: 'liarAt', box: formula.box };
  if (formula.type === 'not') return formula.value;
  return { type: 'not', value: formula };
};

const isLiar = (world, box) => (world.liarMask & (2 ** box)) !== 0;

/** @param {Formula} formula @param {InternalWorld} world */
export const evaluateFormula = (formula, world) => {
  switch (formula.type) {
    case 'gemAt': return world.gem === formula.box;
    case 'liarAt': return isLiar(world, formula.box);
    case 'truthfulAt': return !isLiar(world, formula.box);
    case 'gemIsLiar': return isLiar(world, world.gem);
    case 'not': return !evaluateFormula(formula.value, world);
    case 'and': return evaluateFormula(formula.left, world) && evaluateFormula(formula.right, world);
    case 'or': return evaluateFormula(formula.left, world) || evaluateFormula(formula.right, world);
    case 'xor': return evaluateFormula(formula.left, world) !== evaluateFormula(formula.right, world);
    case 'iff': return evaluateFormula(formula.left, world) === evaluateFormula(formula.right, world);
    case 'implies': return !evaluateFormula(formula.left, world) || evaluateFormula(formula.right, world);
    default: throw new Error(`Unknown formula type: ${formula.type}`);
  }
};

const formulaKind = (formula) => {
  if (['gemAt', 'liarAt', 'truthfulAt', 'gemIsLiar'].includes(formula.type)) return 0;
  return { not: 1, and: 2, or: 3, xor: 4, iff: 5, implies: 6 }[formula.type];
};

const readableFormula = (formula) => {
  if (['gemAt', 'liarAt', 'truthfulAt', 'gemIsLiar'].includes(formula.type)) return true;
  if (formula.type === 'not') return formula.value.type !== 'not' && readableFormula(formula.value);
  return JSON.stringify(formula.left) !== JSON.stringify(formula.right)
    && readableFormula(formula.left) && readableFormula(formula.right);
};

const readableCandidate = (boxCount, statements) => {
  const distinctStatements = new Set(statements.map((formula) => JSON.stringify(formula))).size === boxCount;
  const requiredKinds = boxCount <= 3 ? Math.min(boxCount, 2) : 3;
  const kindCount = new Set(statements.map(formulaKind)).size;
  return distinctStatements && statements.every(readableFormula) && kindCount >= requiredKinds;
};

const targetWorld = (boxCount, liarCount, seed, attempt) => {
  const liarOffset = mix(seed, attempt, liarCount, 23);
  let liarMask = 0;
  for (let box = 0; box < boxCount; box += 1) {
    if (((box + liarOffset) % boxCount) < liarCount) liarMask += 2 ** box;
  }
  return {
    gem: boxIndex(boxCount, mix(seed, attempt, liarCount, 19)),
    liarMask,
  };
};

const candidateStatements = (boxCount, liarCount, seed, attempt) => {
  const target = targetWorld(boxCount, liarCount, seed, attempt);
  return Array.from({ length: boxCount }, (_, speaker) => {
    const formula = formulaForCode(
      boxCount,
      speaker,
      mix(seed, attempt, speaker, boxCount + liarCount),
    );
    const expected = !isLiar(target, speaker);
    return evaluateFormula(formula, target) === expected ? formula : negated(formula);
  });
};

const bitCount = (value) => {
  let count = 0;
  for (let bits = value; bits !== 0; bits >>>= 1) count += bits & 1;
  return count;
};

const uniqueSolution = (boxCount, liarCount, statements) => {
  let solution = null;
  const maskLimit = 2 ** boxCount;
  for (let liarMask = 0; liarMask < maskLimit; liarMask += 1) {
    if (bitCount(liarMask) !== liarCount) continue;
    for (let gem = 0; gem < boxCount; gem += 1) {
      const world = { gem, liarMask };
      const valid = statements.every((formula, speaker) => (
        evaluateFormula(formula, world) === !isLiar(world, speaker)
      ));
      if (!valid) continue;
      if (solution) return null;
      solution = world;
    }
  }
  return solution;
};

const boxPhrase = (box) => `the ${names[box]} box`;

/** @param {Formula} formula */
const clause = (formula) => {
  if (formula.type === 'gemAt') return `the gem is in ${boxPhrase(formula.box)}`;
  if (formula.type === 'liarAt') return `${boxPhrase(formula.box)} is lying`;
  if (formula.type === 'truthfulAt') return `${boxPhrase(formula.box)} is telling the truth`;
  if (formula.type === 'gemIsLiar') return 'the box containing the gem is lying';
  if (formula.type === 'not') {
    const value = formula.value;
    if (value.type === 'gemAt') return `the gem is not in ${boxPhrase(value.box)}`;
    if (value.type === 'liarAt') return `${boxPhrase(value.box)} is not lying`;
    if (value.type === 'truthfulAt') return `${boxPhrase(value.box)} is lying`;
    if (value.type === 'gemIsLiar') return 'the box containing the gem is telling the truth';
    if (value.type === 'and') return `it is not true that both ${clause(value.left)} and ${clause(value.right)}`;
    if (value.type === 'or') return `neither ${clause(value.left)}, nor ${clause(value.right)}`;
    if (value.type === 'xor') return `these have the same truth value: ${clause(value.left)}; ${clause(value.right)}`;
    if (value.type === 'iff') return `exactly one is true: ${clause(value.left)}; ${clause(value.right)}`;
    if (value.type === 'implies') return `${clause(value.left)}, and it is false that ${clause(value.right)}`;
    return `it is not the case that ${clause(value)}`;
  }
  if (formula.type === 'and') return `${clause(formula.left)}, and ${clause(formula.right)}`;
  if (formula.type === 'or') return `either ${clause(formula.left)}, or ${clause(formula.right)}`;
  if (formula.type === 'xor') return `exactly one is true: ${clause(formula.left)}; ${clause(formula.right)}`;
  if (formula.type === 'iff') return `${clause(formula.left)} if and only if ${clause(formula.right)}`;
  if (formula.type === 'implies') return `if ${clause(formula.left)}, then ${clause(formula.right)}`;
  throw new Error(`Unknown formula type: ${formula.type}`);
};

const renderStatement = (formula) => {
  const text = clause(formula);
  return `${text[0].toUpperCase()}${text.slice(1)}.`;
};

const liarIndexes = (boxCount, liarMask) => Array.from({ length: boxCount }, (_, box) => box)
  .filter((box) => (liarMask & (2 ** box)) !== 0);

const leanSource = (boxCount, liarCount, seed, attempt) => (
  `import BoxPuzzles\n\nopen BoxPuzzles\n\n`
  + `def puzzle : Puzzle ${boxCount} :=\n`
  + `  BoxPuzzles.candidatePuzzle ${boxCount} (by decide) ${liarCount} ${seed} ${attempt}\n\n`
  + 'example : HasUniqueSolution puzzle := by\n  native_decide\n'
);

export const generatePuzzle = (boxCount, liarCount, seed) => {
  if (!Number.isSafeInteger(boxCount) || boxCount < 2 || boxCount > 16) return null;
  if (!Number.isSafeInteger(liarCount) || liarCount < 1 || liarCount >= boxCount) return null;
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) return null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const statements = candidateStatements(boxCount, liarCount, seed, attempt);
    if (!readableCandidate(boxCount, statements)) continue;
    const solution = uniqueSolution(boxCount, liarCount, statements);
    if (!solution) continue;
    const liars = liarIndexes(boxCount, solution.liarMask);
    return {
      id: `bp-${boxCount}-${liarCount}-${seed}`,
      boxCount,
      liarCount,
      seed,
      attempt,
      boxes: statements.map((ast, id) => ({
        id,
        letter: letters[id],
        name: names[id],
        color: colors[id],
        statement: renderStatement(ast),
        ast,
      })),
      gem: solution.gem,
      liars,
      worlds: [{ gem: solution.gem, liars }],
      leanSource: leanSource(boxCount, liarCount, seed, attempt),
    };
  }
  return null;
};
