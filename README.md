# Box Logic

Procedurally generated colored-box puzzles governed by three rules:

1. Exactly one box contains the gem.
2. The selected liar count determines exactly how many inscriptions are false; every other inscription is true.
3. Each inscription is one complete Boolean statement. Its clauses do not lie independently; a false “A or B” means both A and B are false.
4. Every valid case agrees on both the gem and the complete set of liar boxes.

The browser generates a candidate from the selected box count, liar count, and seed, then exhaustively checks every possible world. A puzzle is accepted only when:

- at least one world satisfies every inscription;
- each satisfying world has exactly the selected number of false inscriptions; and
- all satisfying worlds agree on the gem location and the complete liar set.

The same settings and seed always reconstruct the same puzzle. Random generation uses a fresh 32-bit seed and never selects from a prebuilt catalog. Every accepted puzzle includes reproducible Lean source for the repository's formal model.

## Development

Lean 4.33.1 and Node 22 or later are required.

```sh
lake build
npm ci
npm test
npm run build:pages
```

## Logic vocabulary

Atoms describe the gem location, liar identity, truth status of a named box, or whether the gem's box is lying. Formulas use negation, conjunction, disjunction, exclusive-or, equivalence, and implication, with shallow generation and readability filters.
