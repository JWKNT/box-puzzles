import BoxPuzzles.Generator

namespace BoxPuzzles

example (certified : CertifiedPuzzle n) : HasUniqueSolution certified.puzzle :=
  certified.certificate

end BoxPuzzles
