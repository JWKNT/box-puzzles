import BoxPuzzles.Export

namespace BoxPuzzles

#guard generatedCatalog.length == 168
#guard (generatedCatalog.map (·.boxCount)).all fun count => 2 ≤ count && count ≤ 8

example : HasUniqueGem exampleTwo := by native_decide

end BoxPuzzles
