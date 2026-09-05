'use client';

import { useEffect, useRef, useState } from 'react';
import { generatePuzzle } from './puzzleGenerator.mjs';

type Formula = { type: string; box?: number; value?: Formula; left?: Formula; right?: Formula };
type Box = { id: number; letter: string; name: string; color: string; statement: string; ast: Formula };
type World = { gem: number; liars: number[] };
type Puzzle = {
  id: string;
  boxCount: number;
  liarCount: number;
  seed: number;
  attempt: number;
  boxes: Box[];
  gem: number;
  liars: number[];
  worlds: World[];
  leanSource: string;
};
type Result = 'correct' | 'incorrect' | 'revealed' | null;

const MAX_SEED = 0xffffffff;
const initialPuzzle = generatePuzzle(2, 1, 0) as Puzzle;

const randomSeed = () => {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
};

export default function PuzzleApp() {
  const [boxCount, setBoxCount] = useState(2);
  const [liarCount, setLiarCount] = useState(1);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(initialPuzzle);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState('Copy Lean source');
  const generationToken = useRef(0);

  useEffect(() => {
    const themeScript = document.createElement('script');
    themeScript.src = 'https://jehlp.net/site-theme/v2/theme.js';
    themeScript.dataset.boxPuzzlesTheme = 'true';
    document.head.append(themeScript);

    const params = new URLSearchParams(window.location.search);
    const requestedBoxCount = Number(params.get('n'));
    const requestedLiarCount = Number(params.get('l'));
    const legacySeed = params.get('p')?.split('-').at(-1);
    const requestedSeed = Number(params.get('seed') ?? legacySeed);
    const validRequest = requestedBoxCount >= 2 && requestedBoxCount <= 16
      && requestedLiarCount >= 1 && requestedLiarCount < requestedBoxCount
      && Number.isSafeInteger(requestedSeed) && requestedSeed >= 0 && requestedSeed <= MAX_SEED;

    const timer = validRequest && (
      requestedBoxCount !== 2 || requestedLiarCount !== 1 || requestedSeed !== 0
    ) ? window.setTimeout(() => {
        setGenerating(true);
        const generated = generatePuzzle(requestedBoxCount, requestedLiarCount, requestedSeed) as Puzzle | null;
        setBoxCount(requestedBoxCount);
        setLiarCount(requestedLiarCount);
        setPuzzle(generated);
        setGenerationError(generated ? null : 'No unique puzzle was found for that seed.');
        setGenerating(false);
      }, 0) : undefined;

    return () => {
      themeScript.remove();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!puzzle) return;
    const url = new URL(window.location.href);
    url.searchParams.set('n', String(puzzle.boxCount));
    url.searchParams.set('l', String(puzzle.liarCount));
    url.searchParams.set('seed', String(puzzle.seed));
    url.searchParams.delete('p');
    window.history.replaceState(null, '', url);
  }, [puzzle]);

  const clearAnswer = () => {
    setSelected(null);
    setResult(null);
    setSeedError(null);
    setCopyLabel('Copy Lean source');
  };

  const generateFromSeed = (seed: number, nextBoxCount = boxCount, nextLiarCount = liarCount) => {
    const token = generationToken.current + 1;
    generationToken.current = token;
    setGenerating(true);
    setGenerationError(null);
    clearAnswer();
    window.setTimeout(() => {
      const generated = generatePuzzle(nextBoxCount, nextLiarCount, seed) as Puzzle | null;
      if (generationToken.current !== token) return;
      setPuzzle(generated);
      setGenerationError(generated ? null : 'No unique puzzle was found for that seed. Try another seed.');
      setGenerating(false);
    }, 0);
  };

  const chooseBoxCount = (count: number) => {
    generationToken.current += 1;
    setBoxCount(count);
    setLiarCount((current) => Math.min(current, count - 1));
    setPuzzle(null);
    setGenerating(false);
    setGenerationError(null);
    clearAnswer();
  };

  const chooseLiarCount = (count: number) => {
    generationToken.current += 1;
    setLiarCount(count);
    setPuzzle(null);
    setGenerating(false);
    setGenerationError(null);
    clearAnswer();
  };

  const loadSeed = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const seed = Number(new FormData(event.currentTarget).get('seed'));
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > MAX_SEED) {
      setSeedError(`Enter a whole-number seed from 0 to ${MAX_SEED}.`);
      return;
    }
    generateFromSeed(seed);
  };

  const checkAnswer = () => {
    if (selected == null || !puzzle) return;
    setResult(selected === puzzle.gem ? 'correct' : 'incorrect');
  };

  const reveal = () => {
    if (!puzzle) return;
    setSelected(puzzle.gem);
    setResult('revealed');
  };

  const copyLean = async () => {
    if (!puzzle) return;
    await navigator.clipboard.writeText(puzzle.leanSource);
    setCopyLabel('Copied');
    window.setTimeout(() => setCopyLabel('Copy Lean source'), 1600);
  };

  const solved = result === 'correct' || result === 'revealed';
  const gemBox = puzzle?.boxes[puzzle.gem];
  const liarNames = puzzle?.liars.map((liar) => puzzle.boxes[liar].name).join(', ');
  const truthfulCount = boxCount - liarCount;

  return (
    <>
      <a className="skip-link" href="#puzzle">Skip to puzzle</a>
      <header className="site-header site-header--identity">
        <div className="site-brand"><span className="site-mark" aria-hidden="true">◆</span><span className="site-title">Box Logic</span></div>
        <nav aria-label="Site links">
          <a href="https://github.com/JWKNT/box-puzzles">Source</a>
          <button className="theme-toggle" type="button" data-theme-toggle aria-label="Use dark theme" aria-pressed="false">◐</button>
        </nav>
      </header>

      <main className="page-shell" id="puzzle" aria-labelledby="page-title">
        <h1 className="sr-only" id="page-title">Box logic</h1>
        <div className="puzzle-setup">
          <section className="rules" aria-labelledby="rules-title">
            <h2 id="rules-title">Rules</h2>
            <ol>
              <li>Exactly one box contains the gem.</li>
              <li>Exactly {liarCount} {liarCount === 1 ? 'inscription is' : 'inscriptions are'} false; the other {truthfulCount} {truthfulCount === 1 ? 'is' : 'are'} true.</li>
              <li>Each inscription is evaluated as one complete statement; its parts do not lie independently. If a false inscription says “A or B,” then both A and B are false.</li>
              <li>The inscriptions uniquely determine both the gem box and every liar box. Select the gem box.</li>
            </ol>
          </section>
          <div className="puzzle-controls">
            <div className="range-control">
              <label htmlFor="box-count">Boxes <output htmlFor="box-count">{boxCount}</output></label>
              <input id="box-count" type="range" min="2" max="16" value={boxCount} onChange={(event) => chooseBoxCount(Number(event.target.value))} />
            </div>
            <div className="range-control">
              <label htmlFor="liar-count">Liar boxes <output htmlFor="liar-count">{liarCount}</output></label>
              <input id="liar-count" type="range" min="1" max={boxCount - 1} value={liarCount} onChange={(event) => chooseLiarCount(Number(event.target.value))} />
            </div>
            <button className="generate-puzzle" type="button" disabled={generating} onClick={() => generateFromSeed(randomSeed())}>
              {generating ? 'Generating…' : 'Generate puzzle'}
            </button>
          </div>
        </div>

        {generating && <p className="loading" role="status">Generating from the seed and checking every possible case…</p>}
        {generationError && <p className="load-error" role="alert">{generationError}</p>}
        {!puzzle && !generating && !generationError && (
          <p className="empty-state">Choose the box and liar counts, then generate a puzzle or enter a seed.</p>
        )}

        {puzzle && !generating && (
          <>
            <fieldset className="puzzle-fieldset">
              <legend className="sr-only">Choose the box containing the gem</legend>
              <div className="boxes" style={{ '--box-count': Math.min(boxCount, 4) } as React.CSSProperties}>
                {puzzle.boxes.map((box) => {
                  const isGem = box.id === puzzle.gem;
                  const isFalse = puzzle.liars.includes(box.id);
                  return (
                    <label className={`box${selected === box.id ? ' is-selected' : ''}${solved ? ' is-solved' : ''}${solved && isGem ? ' has-gem' : ''}`} key={box.id} style={{ '--box-color': box.color } as React.CSSProperties}>
                      <input type="radio" name="gem-box" value={box.id} checked={selected === box.id} onChange={() => { setSelected(box.id); setResult(null); }} />
                      <span className="box-lid" aria-hidden="true"><span /></span>
                      <span className="box-body">
                        <span className="box-identity"><b>{box.letter}</b><span>{box.name} box</span></span>
                        <q>{box.statement.replace(/\.$/, '')}</q>
                        {solved ? (
                          <span className="box-verdict">
                            <span className={`verdict-badge is-${isFalse ? 'false' : 'true'}`}>{isFalse ? 'False' : 'True'}<span className="sr-only"> inscription</span></span>
                            {isGem && <span className="verdict-badge is-gem"><span aria-hidden="true">◆</span> Gem</span>}
                          </span>
                        ) : (
                          <span className="box-choice">{selected === box.id ? 'Selected' : ''}</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="answer-actions">
              <button className="check-answer" type="button" disabled={selected == null} onClick={checkAnswer}>Check answer</button>
              <button className="reveal-answer" type="button" onClick={reveal}>Reveal</button>
              <form className="seed-picker" onSubmit={loadSeed}>
                <label htmlFor="seed-input">Seed</label>
                <input id="seed-input" name="seed" key={puzzle.id} type="number" min="0" max={MAX_SEED} step="1" defaultValue={puzzle.seed} />
                <button type="submit">Load seed</button>
              </form>
              <span className="puzzle-id">attempt {puzzle.attempt} · 1 valid case</span>
            </div>

            {seedError && <p className="seed-error" role="alert">{seedError}</p>}

            {!solved && (
              <div className={`answer-status${result ? ` is-${result}` : ''}`} role="status" aria-live="polite">
                {result === 'incorrect' && 'Not the solution. Try another, or reveal.'}
              </div>
            )}

            {solved && (
              <section className="solution-panel" aria-labelledby="solution-title" aria-live="polite">
                <div className="solution-heading">
                  <span className="solution-symbol" aria-hidden="true">◆</span>
                  <div>
                    <p className="eyebrow">Solution</p>
                    <h2 id="solution-title">{gemBox.name} box contains the gem</h2>
                  </div>
                </div>
                <div className="solution-fact">
                  <span>False {puzzle.liarCount === 1 ? 'inscription' : 'inscriptions'}</span>
                  <strong>{liarNames}</strong>
                </div>
              </section>
            )}

            <details className="certificate">
              <summary>Lean proof source <span>{puzzle.id} · reproducible</span></summary>
              <div className="certificate-grid">
                <dl>
                  <div><dt>Model</dt><dd>exactly one gem and exactly {puzzle.liarCount} false {puzzle.liarCount === 1 ? 'inscription' : 'inscriptions'}</dd></div>
                  <div><dt>Verifier</dt><dd>exhaustive browser search</dd></div>
                  <div><dt>Seed</dt><dd>{puzzle.seed}</dd></div>
                  <div><dt>Attempt</dt><dd>{puzzle.attempt}</dd></div>
                  <div><dt>Forced gem</dt><dd>{gemBox.name}</dd></div>
                  <div><dt>Forced liars</dt><dd>{liarNames}</dd></div>
                </dl>
                <div>
                  <div className="code-heading"><h3>Exact instance</h3><button type="button" onClick={copyLean}>{copyLabel}</button></div>
                  <pre><code>{puzzle.leanSource}</code></pre>
                </div>
              </div>
              <details className="normalized-ast"><summary>Normalized statements</summary><pre><code>{JSON.stringify(puzzle.boxes.map((box) => box.ast), null, 2)}</code></pre></details>
            </details>
          </>
        )}

        {!puzzle && (
          <form className="standalone-seed-picker" onSubmit={loadSeed}>
            <label htmlFor="standalone-seed-input">Seed</label>
            <input id="standalone-seed-input" name="seed" type="number" min="0" max={MAX_SEED} step="1" defaultValue="0" />
            <button type="submit" disabled={generating}>Generate from seed</button>
          </form>
        )}
      </main>
    </>
  );
}
