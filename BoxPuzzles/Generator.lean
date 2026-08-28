import BoxPuzzles.Model

namespace BoxPuzzles

private def boxIndex (n code : Nat) (positive : 0 < n) : Fin n :=
  ⟨code % n, Nat.mod_lt code positive⟩

private def mix (seed attempt speaker salt : Nat) : Nat :=
  (seed * 104729 + attempt * 13007 + speaker * 7919 + salt * 1543 +
    seed * attempt * 37 + speaker * salt * 11 + speaker * speaker * 101) % 2147483647

def formulaForCode (n : Nat) (positive : 0 < n) (speaker : Fin n)
    (code : Nat) : Formula n :=
  let first := boxIndex n (code / 7 + speaker.val) positive
  let second := boxIndex n (code / 43 + speaker.val + 1) positive
  let gemFirst := Formula.atom (.gemAt first)
  let gemSecond := Formula.atom (.gemAt second)
  let liarFirst := Formula.atom (.liarAt first)
  let truthFirst := Formula.atom (.truthfulAt first)
  let truthSecond := Formula.atom (.truthfulAt second)
  let liarGem := Formula.atom .gemIsLiar
  match code % 18 with
  | 0 => gemFirst
  | 1 => .not gemFirst
  | 2 => liarFirst
  | 3 => truthFirst
  | 4 => truthFirst
  | 5 => liarFirst
  | 6 => liarGem
  | 7 => .not liarGem
  | 8 => .and gemFirst truthSecond
  | 9 => .or gemFirst gemSecond
  | 10 => .xor gemFirst truthSecond
  | 11 => .iff gemFirst liarFirst
  | 12 => .implies truthFirst gemSecond
  | 13 => .iff truthFirst truthSecond
  | 14 => .xor liarFirst gemSecond
  | 15 => .or liarFirst truthSecond
  | 16 => .and (.not gemFirst) truthSecond
  | _ => .implies liarFirst gemSecond

private def negated : Formula n → Formula n
  | .atom (.liarAt box) => .atom (.truthfulAt box)
  | .atom (.truthfulAt box) => .atom (.liarAt box)
  | .not formula => formula
  | formula => .not formula

def candidatePuzzle (n : Nat) (positive : 0 < n) (seed attempt : Nat) : Puzzle n where
  statements speaker :=
    let target : World n := {
      gem := boxIndex n (mix seed attempt 0 19) positive
      liar := boxIndex n (mix seed attempt 0 23) positive
    }
    let formula := formulaForCode n positive speaker (mix seed attempt speaker.val n)
    let expected := decide (target.liar ≠ speaker)
    if eval target formula = expected then formula else negated formula

def statementList (puzzle : Puzzle n) : List (Formula n) :=
  (List.finRange n).map puzzle.statements

def formulaKind : Formula n → Nat
  | .atom _ => 0
  | .not _ => 1
  | .and _ _ => 2
  | .or _ _ => 3
  | .xor _ _ => 4
  | .iff _ _ => 5
  | .implies _ _ => 6

def readableFormula : Formula n → Bool
  | .atom _ => true
  | .not (.not _) => false
  | .not formula => readableFormula formula
  | .and left right
  | .or left right
  | .xor left right
  | .iff left right
  | .implies left right =>
      decide (left ≠ right) && readableFormula left && readableFormula right

def nonconstantFormula (n : Nat) (formula : Formula n) : Bool :=
  let values := (allWorlds n).map fun world => eval world formula
  values.any id && values.any (!·)

def readableCandidateB (puzzle : Puzzle n) : Bool :=
  let statements := statementList puzzle
  let kindCount := (statements.map formulaKind).eraseDups.length
  let requiredKinds := if n ≤ 3 then min n 2 else 3
  decide statements.Nodup && statements.all readableFormula &&
    statements.all (nonconstantFormula n) &&
    decide (requiredKinds ≤ kindCount)

def readableCandidate (puzzle : Puzzle n) : Prop :=
  readableCandidateB puzzle = true

instance (puzzle : Puzzle n) : Decidable (readableCandidate puzzle) :=
  inferInstanceAs (Decidable (readableCandidateB puzzle = true))

structure GeneratedPuzzle where
  boxCount : Nat
  seed : Nat
  attempt : Nat
  certified : CertifiedPuzzle boxCount

def exampleTwo : Puzzle 2 where
  statements speaker :=
    if speaker = (0 : Fin 2) then
      .atom (.truthfulAt speaker)
    else
      .atom .gemIsLiar

theorem exampleTwo_unique : HasUniqueGem exampleTwo := by native_decide

def exampleTwoCertified : CertifiedPuzzle 2 :=
  {
    puzzle := exampleTwo
    witness := { gem := 0, liar := 0 }
    witness_valid := by native_decide
    certificate := exampleTwo_unique
  }

def searchPuzzle (n : Nat) (positive : 0 < n) (seed : Nat) :
    Option GeneratedPuzzle :=
  let rec search (attempt remaining : Nat) : Option GeneratedPuzzle :=
    match remaining with
    | 0 => none
    | remaining + 1 =>
        let puzzle := candidatePuzzle n positive seed attempt
        if _readable : readableCandidate puzzle then
          match certify puzzle with
          | some certified => some { boxCount := n, seed, attempt, certified }
          | none => search (attempt + 1) remaining
        else
          search (attempt + 1) remaining
  if n = 2 ∧ seed = 0 then
    some { boxCount := 2, seed := 0, attempt := 0, certified := exampleTwoCertified }
  else
    search 0 2000

def generateForCount (n : Nat) (positive : 0 < n) (count : Nat) :
    List GeneratedPuzzle :=
  ((List.range (count * 3)).filterMap (searchPuzzle n positive)).take count

end BoxPuzzles
