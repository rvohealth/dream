import { LoadForModifierFn } from '../../types/query.js'
import { DreamClassAndAssociationNameTuple } from '../../types/recursiveSerialization.js'

export default function convertDreamClassAndAssociationNameTupleArrayToPreloadArgs(
  dreamClassAndAssociationNameTupleArray: DreamClassAndAssociationNameTuple[],
  modifierFn?: LoadForModifierFn,
  counter?: { count: number }
): (string | { and?: object; andAny?: object; andNot?: object })[] {
  const preloadArgs: (string | { and?: object; andAny?: object; andNot?: object })[] = []

  for (const dreamClassAndAssociationNameTuple of dreamClassAndAssociationNameTupleArray) {
    const associationName = dreamClassAndAssociationNameTuple[1]
    const aliasedAssociationName = counter ? `${associationName} as drsz${counter.count++}` : associationName

    if (!modifierFn) {
      preloadArgs.push(aliasedAssociationName)
      continue
    }

    const modifier = modifierFn(associationName, dreamClassAndAssociationNameTuple[0])

    // omitting an association prunes the entire subtree beneath it: the path is truncated at the
    // omitted association, keeping the ancestors already accumulated (so the omitted association's
    // parent is still preloaded) and discarding the remainder, since the surviving tail would be
    // re-rooted on the class the query was rooted on and preload a different association than the
    // caller asked for. When the omitted association is the first tuple, this yields an empty list.
    if (modifier === 'omit') return preloadArgs

    preloadArgs.push(aliasedAssociationName)
    if (modifier !== undefined && modifier !== null) preloadArgs.push(modifier)
  }

  return preloadArgs
}
