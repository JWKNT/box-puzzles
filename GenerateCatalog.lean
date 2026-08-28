import BoxPuzzles.Export

open Lean BoxPuzzles

def main (args : List String) : IO UInt32 := do
  if generatedCatalog.length != 168 then
    IO.eprintln s!"expected 168 verified puzzles, generated {generatedCatalog.length}"
    return 1
  let payload := (toJson catalogJson).pretty 120 ++ "\n"
  match args with
  | [] =>
      IO.print payload
      return 0
  | [output] =>
      let path := System.FilePath.mk output
      if let some parent := path.parent then IO.FS.createDirAll parent
      IO.FS.writeFile path payload
      return 0
  | _ =>
      IO.eprintln "usage: box-puzzle-catalog [OUTPUT.json]"
      return 2
