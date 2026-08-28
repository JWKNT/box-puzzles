# Box Logic

Procedurally generated colored-box puzzles governed by three rules:

1. Exactly one box contains the gem.
2. The selected liar count determines exactly how many inscriptions are false; every other inscription is true.
3. Every valid case agrees on both the gem and the complete set of liar boxes.

Lean constructs and certifies the published catalog. A world contains one `Fin n` gem location and a list of liar boxes with the selected length. A puzzle is exported only when:

- at least one world satisfies every inscription;
- each satisfying world has exactly the selected number of false inscriptions; and
- all satisfying worlds agree on the gem location and the complete liar set.

The browser independently evaluates the normalized formula tree for explanations and answer checking. It does not generate unverified instances.

## Development

Lean 4.33.1 and Node 22 or later are required.

```sh
lake build
npm ci
npm test
npm run build:pages
```

`lake exe box-puzzle-catalog public/puzzles.json` regenerates all 480 published puzzles. The GitHub workflow rebuilds the catalog and fails if the committed copy changes.

## Logic vocabulary

Atoms describe the gem location, liar identity, truth status of a named box, or whether the liar contains the gem. Formulas use negation, conjunction, disjunction, exclusive-or, equivalence, and implication, with shallow generation and readability filters.
