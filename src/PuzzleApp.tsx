'use client';

import { useEffect, useMemo, useState } from 'react';

type Formula = { type: string; box?: number; value?: Formula; left?: Formula; right?: Formula };
type Box = { id: number; letter: string; name: string; color: string; statement: string; ast: Formula };
type World = { gem: number; liar: number };
type Puzzle = {
  id: string;
  boxCount: number;
  seed: number;
  attempt: number;
  boxes: Box[];
  gem: number;
  possibleLiars: number[];
  worlds: World[];
  leanSource: string;
};
type Catalog = {
  schema: number;
  model: string;
  theoremExistence: string;
  theoremUniqueness: string;
  puzzles: Puzzle[];
};
type Result = 'correct' | 'incorrect' | 'revealed' | null;

const randomIndex = (length: number) => {
  if (length < 2) return 0;
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
};

export default function PuzzleApp() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [boxCount, setBoxCount] = useState(2);
  const [puzzleId, setPuzzleId] = useState('bp-2-0');
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [copyLabel, setCopyLabel] = useState('Copy Lean source');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const themeScript = document.createElement('script');
    themeScript.src = 'https://jehlp.net/site-theme/v2/theme.js';
    themeScript.dataset.boxPuzzlesTheme = 'true';
    document.head.append(themeScript);

    const params = new URLSearchParams(window.location.search);
    const requestedCount = Number(params.get('n'));
    const requestedPuzzle = params.get('p');
    fetch('./puzzles.json')
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data: Catalog) => {
        setCatalog(data);
        if (requestedCount >= 2 && requestedCount <= 8) setBoxCount(requestedCount);
        if (requestedPuzzle) setPuzzleId(requestedPuzzle);
      })
      .catch(() => setLoadError(true));

    return () => themeScript.remove();
  }, []);

  const choices = useMemo(
    () => catalog?.puzzles.filter((puzzle) => puzzle.boxCount === boxCount) ?? [],
    [catalog, boxCount],
  );
  const puzzle = choices.find((entry) => entry.id === puzzleId) ?? choices[0];

  useEffect(() => {
    if (!puzzle) return;
    const url = new URL(window.location.href);
    url.searchParams.set('n', String(puzzle.boxCount));
    url.searchParams.set('p', puzzle.id);
    window.history.replaceState(null, '', url);
  }, [puzzle, puzzleId]);

  const clearAnswer = () => {
    setSelected(null);
    setResult(null);
    setCopyLabel('Copy Lean source');
  };

  const chooseCount = (count: number) => {
    const next = catalog?.puzzles.filter((entry) => entry.boxCount === count) ?? [];
    setBoxCount(count);
    setPuzzleId(next[randomIndex(next.length)]?.id ?? `bp-${count}-0`);
    clearAnswer();
  };

  const newPuzzle = () => {
    if (choices.length === 0) return;
    let next = choices[randomIndex(choices.length)];
    if (choices.length > 1 && next.id === puzzle?.id) {
      next = choices[(choices.indexOf(next) + 1) % choices.length];
    }
    setPuzzleId(next.id);
    clearAnswer();
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
  const liarNames = puzzle?.possibleLiars.map((liar) => puzzle.boxes[liar].name).join(', ');

  return (
    <>
      <a className="skip-link" href="#puzzle">Skip to puzzle</a>
      <header className="site-header">
        <a className="site-name" href="https://jehlp.net/">jehlp.net / box puzzles</a>
        <nav aria-label="Site links">
          <a href="https://github.com/JWKNT/box-puzzles">Source</a>
          <button className="theme-toggle" type="button" data-theme-toggle aria-label="Use dark theme" aria-pressed="false">◐</button>
        </nav>
      </header>

      <main className="page-shell" id="puzzle">
        <section className="puzzle-heading" aria-labelledby="page-title">
          <div>
            <h1 id="page-title">Box logic</h1>
          </div>
          <div className="puzzle-controls">
            <label htmlFor="box-count">Boxes <output htmlFor="box-count">{boxCount}</output></label>
            <input id="box-count" type="range" min="2" max="8" value={boxCount} onChange={(event) => chooseCount(Number(event.target.value))} />
            <button className="new-puzzle" type="button" onClick={newPuzzle}>New puzzle</button>
          </div>
        </section>

        <section className="rules" aria-labelledby="rules-title">
          <h2 id="rules-title">Rules</h2>
          <ol>
            <li>Exactly one box contains the gem.</li>
            <li>Exactly one box&apos;s inscription is false; every other inscription is true.</li>
            <li>Every valid case puts the gem in the same box. Select that box. The false inscription may differ between valid cases.</li>
          </ol>
        </section>

        {loadError && <p className="load-error" role="alert">The verified puzzle catalog could not be loaded.</p>}
        {!puzzle && !loadError && <p className="loading" role="status">Loading verified puzzles…</p>}

        {puzzle && (
          <>
            <fieldset className="puzzle-fieldset">
              <legend className="sr-only">Choose the box containing the gem</legend>
              <div className="boxes" style={{ '--box-count': Math.min(boxCount, 4) } as React.CSSProperties}>
                {puzzle.boxes.map((box) => (
                  <label className={`box${selected === box.id ? ' is-selected' : ''}${solved && box.id === puzzle.gem ? ' has-gem' : ''}`} key={box.id} style={{ '--box-color': box.color } as React.CSSProperties}>
                    <input type="radio" name="gem-box" value={box.id} checked={selected === box.id} onChange={() => { setSelected(box.id); setResult(null); }} />
                    <span className="box-lid" aria-hidden="true"><span /></span>
                    <span className="box-body">
                      <span className="box-identity"><b>{box.letter}</b><span>{box.name} box</span></span>
                      <q>{box.statement.replace(/\.$/, '')}</q>
                      <span className="box-choice">{selected === box.id ? 'Selected' : 'Choose'}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="answer-actions">
              <button className="check-answer" type="button" disabled={selected == null} onClick={checkAnswer}>Check answer</button>
              <button className="reveal-answer" type="button" onClick={reveal}>Reveal</button>
              <span className="puzzle-id">seed {puzzle.seed} · {puzzle.worlds.length} valid {puzzle.worlds.length === 1 ? 'case' : 'cases'}</span>
            </div>

            <div className={`answer-status${result ? ` is-${result}` : ''}`} role="status" aria-live="polite">
              {!result && 'Choose a box.'}
              {result === 'incorrect' && 'Not forced. Try another, or reveal.'}
              {result === 'correct' && <>Correct · <strong>{gemBox.name} box</strong></>}
              {result === 'revealed' && <>Gem · <strong>{gemBox.name} box</strong></>}
            </div>

            {solved && (
              <section className="reasoning" aria-labelledby="reasoning-title">
                <div className="section-heading">
                  <div><p className="eyebrow">Result</p><h2 id="reasoning-title">All valid cases agree</h2></div>
                  <p>{puzzle.possibleLiars.length > 1
                    ? `Possible liars: ${liarNames}. Gem: ${gemBox.name} in every case.`
                    : `Liar: ${liarNames}. Gem: ${gemBox.name}.`}</p>
                </div>
                <div className="model-table-wrap">
                  <table>
                    <thead><tr><th>Possible liar</th><th>Gem</th>{puzzle.boxes.map((box) => <th key={box.id}>{box.letter}</th>)}</tr></thead>
                    <tbody>{puzzle.worlds.map((world) => (
                      <tr key={`${world.gem}-${world.liar}`}>
                        <td>{puzzle.boxes[world.liar].name}</td>
                        <td>{puzzle.boxes[world.gem].name}</td>
                        {puzzle.boxes.map((box) => <td key={box.id} aria-label={`${box.name} inscription is ${box.id === world.liar ? 'false' : 'true'}`}>{box.id === world.liar ? 'F' : 'T'}</td>)}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            )}

            <details className="certificate">
              <summary>Lean certificate <span>{puzzle.id} · checked</span></summary>
              <div className="certificate-grid">
                <dl>
                  <div><dt>Model</dt><dd>exactly one gem and exactly one false inscription</dd></div>
                  <div><dt>Valid cases</dt><dd>{puzzle.worlds.length}</dd></div>
                  <div><dt>Forced gem</dt><dd>{gemBox.name}</dd></div>
                  <div><dt>Possible liars</dt><dd>{liarNames}</dd></div>
                  <div><dt>Existence</dt><dd><code>{catalog?.theoremExistence}</code></dd></div>
                  <div><dt>Uniqueness</dt><dd><code>{catalog?.theoremUniqueness}</code></dd></div>
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

      </main>
    </>
  );
}
