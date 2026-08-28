# Box Logic

Procedurally generated colored-box puzzles governed by three rules:

1. Exactly one box contains the gem.
2. Exactly one box's inscription is false; every other inscription is true.
3. Every valid case puts the gem in the same box. The false inscription may differ between valid cases.

Lean constructs and certifies the published catalog. A world contains one `Fin n` gem location and one `Fin n` liar. A puzzle is exported only when:

- at least one world satisfies every inscription;
- each satisfying world has exactly the designated false inscription; and
- all satisfying worlds agree on the gem location.

The browser independently evaluates the normalized formula tree for explanations and answer checking. It does not generate unverified instances.

## Development

Lean 4.33.1 and Node 22 or later are required.

```sh
lake build
npm ci
npm test
npm run build:pages
```

`lake exe box-puzzle-catalog public/puzzles.json` regenerates all 168 published puzzles. The GitHub workflow rebuilds the catalog and fails if the committed copy changes.

## Logic vocabulary

Atoms describe the gem location, liar identity, truth status of a named box, or whether the liar contains the gem. Formulas use negation, conjunction, disjunction, exclusive-or, equivalence, and implication, with shallow generation and readability filters.
