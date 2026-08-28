import Lean
import BoxPuzzles.Generator

open Lean

namespace BoxPuzzles

structure BoxJson where
  id : Nat
  letter : String
  name : String
  color : String
  statement : String
  ast : Json
deriving ToJson

structure WorldJson where
  gem : Nat
  liar : Nat
deriving ToJson

structure PuzzleJson where
  id : String
  boxCount : Nat
  seed : Nat
  attempt : Nat
  boxes : Array BoxJson
  gem : Nat
  possibleLiars : Array Nat
  worlds : Array WorldJson
  leanSource : String
deriving ToJson

structure CatalogJson where
  schema : Nat
  model : String
  theoremExistence : String
  theoremUniqueness : String
  puzzles : Array PuzzleJson
deriving ToJson

def names : Array String :=
  #["red", "blue", "green", "gold", "violet", "teal", "orange", "slate"]

def colors : Array String :=
  #["#a33b32", "#3f6597", "#3d795c", "#9a721c", "#6d5490", "#287982", "#b35f2f", "#5e6672"]

def letters : Array String := #["A", "B", "C", "D", "E", "F", "G", "H"]

private def nameAt (box : Fin n) : String := names[box.val]!

private def boxPhrase (_speaker box : Fin n) : String :=
  s!"the {nameAt box} box"

private def clause (speaker : Fin n) : Formula n → String
  | .atom (.gemAt box) => s!"the gem is in {boxPhrase speaker box}"
  | .atom (.liarAt box) => s!"{boxPhrase speaker box} is lying"
  | .atom (.truthfulAt box) => s!"{boxPhrase speaker box} is telling the truth"
  | .atom .gemIsLiar => "the lying box contains the gem"
  | .not (.atom (.gemAt box)) => s!"the gem is not in {boxPhrase speaker box}"
  | .not (.atom (.liarAt box)) => s!"{boxPhrase speaker box} is not lying"
  | .not (.atom (.truthfulAt box)) => s!"{boxPhrase speaker box} is lying"
  | .not (.atom .gemIsLiar) => "the lying box does not contain the gem"
  | .not (.and left right) => s!"it is not true that both {clause speaker left} and {clause speaker right}"
  | .not (.or left right) => s!"neither {clause speaker left}, nor {clause speaker right}"
  | .not (.xor left right) => s!"these have the same truth value: {clause speaker left}; {clause speaker right}"
  | .not (.iff left right) => s!"exactly one is true: {clause speaker left}; {clause speaker right}"
  | .not (.implies left right) => s!"{clause speaker left}, and it is false that {clause speaker right}"
  | .not formula => s!"it is not the case that {clause speaker formula}"
  | .and left right => s!"{clause speaker left}, and {clause speaker right}"
  | .or left right => s!"either {clause speaker left}, or {clause speaker right}"
  | .xor left right => s!"exactly one is true: {clause speaker left}; {clause speaker right}"
  | .iff left right => s!"{clause speaker left} if and only if {clause speaker right}"
  | .implies left right => s!"if {clause speaker left}, then {clause speaker right}"

def renderStatement (speaker : Fin n) (formula : Formula n) : String :=
  (clause speaker formula).capitalize ++ "."

private def atomJson : Atom n → Json
  | .gemAt box => Json.mkObj [("type", "gemAt"), ("box", toJson box.val)]
  | .liarAt box => Json.mkObj [("type", "liarAt"), ("box", toJson box.val)]
  | .truthfulAt box => Json.mkObj [("type", "truthfulAt"), ("box", toJson box.val)]
  | .gemIsLiar => Json.mkObj [("type", "gemIsLiar")]

def formulaJson : Formula n → Json
  | .atom atom => atomJson atom
  | .not formula => Json.mkObj [("type", "not"), ("value", formulaJson formula)]
  | .and left right => Json.mkObj [("type", "and"), ("left", formulaJson left), ("right", formulaJson right)]
  | .or left right => Json.mkObj [("type", "or"), ("left", formulaJson left), ("right", formulaJson right)]
  | .xor left right => Json.mkObj [("type", "xor"), ("left", formulaJson left), ("right", formulaJson right)]
  | .iff left right => Json.mkObj [("type", "iff"), ("left", formulaJson left), ("right", formulaJson right)]
  | .implies left right => Json.mkObj [("type", "implies"), ("left", formulaJson left), ("right", formulaJson right)]

private def leanSource (generated : GeneratedPuzzle) : String :=
  let definition :=
    if generated.boxCount = 2 ∧ generated.seed = 0 then
      "BoxPuzzles.exampleTwo"
    else
      s!"BoxPuzzles.candidatePuzzle {generated.boxCount} (by decide) {generated.seed} {generated.attempt}"
  s!"import BoxPuzzles\n\nopen BoxPuzzles\n\ndef puzzle : Puzzle {generated.boxCount} :=\n  {definition}\n\nexample : HasUniqueGem puzzle := by\n  native_decide\n"

def generatedToJson (generated : GeneratedPuzzle) : PuzzleJson :=
  let puzzle := generated.certified.puzzle
  let worlds := solutions puzzle
  let boxes := (List.finRange generated.boxCount).map fun speaker =>
    {
      id := speaker.val
      letter := letters[speaker.val]!
      name := names[speaker.val]!
      color := colors[speaker.val]!
      statement :=
        if generated.boxCount = 2 ∧ generated.seed = 0 ∧ speaker.val = 0 then
          "This box is telling the truth."
        else
          renderStatement speaker (puzzle.statements speaker)
      ast := formulaJson (puzzle.statements speaker)
    }
  let possibleLiars := (worlds.map (·.liar.val)).eraseDups
  {
    id := s!"bp-{generated.boxCount}-{generated.seed}"
    boxCount := generated.boxCount
    seed := generated.seed
    attempt := generated.attempt
    boxes := boxes.toArray
    gem := generated.certified.witness.gem.val
    possibleLiars := possibleLiars.toArray
    worlds := (worlds.map fun world => { gem := world.gem.val, liar := world.liar.val }).toArray
    leanSource := leanSource generated
  }

def generatedCatalog : List GeneratedPuzzle :=
  generateForCount 2 (by decide) 24 ++
  generateForCount 3 (by decide) 24 ++
  generateForCount 4 (by decide) 24 ++
  generateForCount 5 (by decide) 24 ++
  generateForCount 6 (by decide) 24 ++
  generateForCount 7 (by decide) 24 ++
  generateForCount 8 (by decide) 24

def catalogJson : CatalogJson :=
  {
    schema := 1
    model := "exactly one liar and one gem; all valid worlds agree on the gem"
    theoremExistence := "BoxPuzzles.certified_has_model"
    theoremUniqueness := "BoxPuzzles.certified_unique_gem"
    puzzles := (generatedCatalog.map generatedToJson).toArray
  }

end BoxPuzzles
