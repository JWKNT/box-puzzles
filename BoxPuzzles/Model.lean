namespace BoxPuzzles

structure World (n : Nat) where
  gem : Fin n
  liar : Fin n
deriving DecidableEq, Repr

inductive Atom (n : Nat) where
  | gemAt : Fin n → Atom n
  | liarAt : Fin n → Atom n
  | truthfulAt : Fin n → Atom n
  | gemIsLiar : Atom n
deriving DecidableEq, Repr

inductive Formula (n : Nat) where
  | atom : Atom n → Formula n
  | not : Formula n → Formula n
  | and : Formula n → Formula n → Formula n
  | or : Formula n → Formula n → Formula n
  | xor : Formula n → Formula n → Formula n
  | iff : Formula n → Formula n → Formula n
  | implies : Formula n → Formula n → Formula n
deriving DecidableEq, Repr

structure Puzzle (n : Nat) where
  statements : Fin n → Formula n

def evalAtom (world : World n) : Atom n → Bool
  | .gemAt box => decide (world.gem = box)
  | .liarAt box => decide (world.liar = box)
  | .truthfulAt box => decide (world.liar ≠ box)
  | .gemIsLiar => decide (world.gem = world.liar)

def eval (world : World n) : Formula n → Bool
  | .atom atom => evalAtom world atom
  | .not formula => !(eval world formula)
  | .and left right => eval world left && eval world right
  | .or left right => eval world left || eval world right
  | .xor left right => eval world left != eval world right
  | .iff left right => eval world left == eval world right
  | .implies left right => !(eval world left) || eval world right

def allWorlds (n : Nat) : List (World n) :=
  (List.finRange n).flatMap fun gem =>
    (List.finRange n).map fun liar => { gem, liar }

def satisfies (puzzle : Puzzle n) (world : World n) : Bool :=
  (List.finRange n).all fun speaker =>
    eval world (puzzle.statements speaker) == decide (world.liar ≠ speaker)

def solutions (puzzle : Puzzle n) : List (World n) :=
  (allWorlds n).filter (satisfies puzzle)

def uniqueGem (puzzle : Puzzle n) : Bool :=
  match solutions puzzle with
  | [] => false
  | first :: rest => rest.all fun world => decide (world.gem = first.gem)

def HasUniqueGem (puzzle : Puzzle n) : Prop := uniqueGem puzzle = true

instance (puzzle : Puzzle n) : Decidable (HasUniqueGem puzzle) :=
  inferInstanceAs (Decidable (uniqueGem puzzle = true))

structure CertifiedPuzzle (n : Nat) where
  puzzle : Puzzle n
  witness : World n
  witness_valid : satisfies puzzle witness = true
  certificate : HasUniqueGem puzzle

theorem mem_allWorlds (world : World n) : world ∈ allWorlds n := by
  rcases world with ⟨gem, liar⟩
  simp [allWorlds]

theorem mem_solutions_iff (puzzle : Puzzle n) (world : World n) :
    world ∈ solutions puzzle ↔ satisfies puzzle world = true := by
  simp [solutions, mem_allWorlds]

def certify (puzzle : Puzzle n) : Option (CertifiedPuzzle n) :=
  match solutionEq : solutions puzzle with
  | [] => none
  | first :: _ =>
      if proof : HasUniqueGem puzzle then
        some {
          puzzle
          witness := first
          witness_valid := by
            apply (mem_solutions_iff puzzle first).mp
            rw [solutionEq]
            simp
          certificate := proof
        }
      else
        none

theorem certified_has_model (certified : CertifiedPuzzle n) :
    ∃ world, satisfies certified.puzzle world = true := by
  exact ⟨certified.witness, certified.witness_valid⟩

theorem certified_unique_gem (certified : CertifiedPuzzle n) :
    ∀ world₁ world₂,
      satisfies certified.puzzle world₁ = true →
      satisfies certified.puzzle world₂ = true →
      world₁.gem = world₂.gem := by
  intro world₁ world₂ valid₁ valid₂
  have member₁ := (mem_solutions_iff certified.puzzle world₁).mpr valid₁
  have member₂ := (mem_solutions_iff certified.puzzle world₂).mpr valid₂
  have certificate := certified.certificate
  generalize solutionEq : solutions certified.puzzle = worlds at member₁ member₂ certificate
  cases worlds with
  | nil => simp at member₁
  | cons first rest =>
      have allEqual : ∀ world ∈ rest, world.gem = first.gem := by
        simpa [HasUniqueGem, uniqueGem, solutionEq] using certificate
      have gem₁ : world₁.gem = first.gem := by
        rcases List.mem_cons.mp member₁ with equal | member
        · simp [equal]
        · exact allEqual world₁ member
      have gem₂ : world₂.gem = first.gem := by
        rcases List.mem_cons.mp member₂ with equal | member
        · simp [equal]
        · exact allEqual world₂ member
      exact gem₁.trans gem₂.symm

end BoxPuzzles
