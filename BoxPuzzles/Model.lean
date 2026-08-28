namespace BoxPuzzles

structure World (n : Nat) where
  gem : Fin n
  liars : List (Fin n)
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
  liarCount : Nat
  statements : Fin n → Formula n

def World.isLiar (world : World n) (box : Fin n) : Bool :=
  world.liars.contains box

def evalAtom (world : World n) : Atom n → Bool
  | .gemAt box => decide (world.gem = box)
  | .liarAt box => world.isLiar box
  | .truthfulAt box => !(world.isLiar box)
  | .gemIsLiar => world.isLiar world.gem

def eval (world : World n) : Formula n → Bool
  | .atom atom => evalAtom world atom
  | .not formula => !(eval world formula)
  | .and left right => eval world left && eval world right
  | .or left right => eval world left || eval world right
  | .xor left right => eval world left != eval world right
  | .iff left right => eval world left == eval world right
  | .implies left right => !(eval world left) || eval world right

def choose : Nat → List α → List (List α)
  | 0, _ => [[]]
  | _ + 1, [] => []
  | count + 1, item :: items =>
      (choose count items).map (item :: ·) ++ choose (count + 1) items

def allWorlds (n liarCount : Nat) : List (World n) :=
  (choose liarCount (List.finRange n)).flatMap fun liars =>
    (List.finRange n).map fun gem => { gem, liars }

def satisfies (puzzle : Puzzle n) (world : World n) : Bool :=
  (List.finRange n).all fun speaker =>
    eval world (puzzle.statements speaker) == !(world.isLiar speaker)

def solutions (puzzle : Puzzle n) : List (World n) :=
  (allWorlds n puzzle.liarCount).filter (satisfies puzzle)

def uniqueSolution (puzzle : Puzzle n) : Bool :=
  match solutions puzzle with
  | [] => false
  | first :: rest => rest.all fun world => decide (world = first)

def HasUniqueSolution (puzzle : Puzzle n) : Prop := uniqueSolution puzzle = true

instance (puzzle : Puzzle n) : Decidable (HasUniqueSolution puzzle) :=
  inferInstanceAs (Decidable (uniqueSolution puzzle = true))

structure CertifiedPuzzle (n : Nat) where
  puzzle : Puzzle n
  witness : World n
  witness_valid : satisfies puzzle witness = true
  certificate : HasUniqueSolution puzzle

def certify (puzzle : Puzzle n) : Option (CertifiedPuzzle n) :=
  match solutionEq : solutions puzzle with
  | [] => none
  | first :: rest =>
      if proof : rest.all (fun world => decide (world = first)) = true then
        some {
          puzzle
          witness := first
          witness_valid := by
            have member : first ∈ solutions puzzle := by
              rw [solutionEq]
              simp
            exact (List.mem_filter.mp member).2
          certificate := by
            simp [HasUniqueSolution, uniqueSolution, solutionEq, proof]
        }
      else
        none

theorem certified_has_model (certified : CertifiedPuzzle n) :
    ∃ world, satisfies certified.puzzle world = true := by
  exact ⟨certified.witness, certified.witness_valid⟩

theorem certified_unique_solution (certified : CertifiedPuzzle n) :
    ∀ world₁ world₂,
      world₁ ∈ solutions certified.puzzle →
      world₂ ∈ solutions certified.puzzle →
      world₁ = world₂ := by
  intro world₁ world₂ member₁ member₂
  have certificate := certified.certificate
  generalize solutionEq : solutions certified.puzzle = worlds at member₁ member₂ certificate
  cases worlds with
  | nil => simp at member₁
  | cons first rest =>
      have allEqual : ∀ world ∈ rest, world = first := by
        simpa [HasUniqueSolution, uniqueSolution, solutionEq] using certificate
      have world₁Eq : world₁ = first := by
        rcases List.mem_cons.mp member₁ with equal | member
        · exact equal
        · exact allEqual world₁ member
      have world₂Eq : world₂ = first := by
        rcases List.mem_cons.mp member₂ with equal | member
        · exact equal
        · exact allEqual world₂ member
      exact world₁Eq.trans world₂Eq.symm

end BoxPuzzles
