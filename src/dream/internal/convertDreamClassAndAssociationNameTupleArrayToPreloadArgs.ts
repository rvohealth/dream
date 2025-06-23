import compact from '../../helpers/compact.js'
import { LoadForModifierFn } from '../../types/query.js'
import { DreamClassAndAssociationNameTuple } from './extractNestedPaths.js'

export default function convertDreamClassAndAssociationNameTupleArrayToPreloadArgs(
  dreamClassAndAssociationNameTupleArray: DreamClassAndAssociationNameTuple[],
  modifierFn?: LoadForModifierFn,
  counter?: { count: number }
): (string | { and?: object; andAny?: object; andNot?: object })[] {
  return compact(
    dreamClassAndAssociationNameTupleArray.flatMap(dreamClassAndAssociationNameTuple => {
      const associationName = dreamClassAndAssociationNameTuple[1]
      const aliasedAssociationName = counter
        ? `${dreamClassAndAssociationNameTuple[1]} as drsz${counter.count++}`
        : dreamClassAndAssociationNameTuple[1]
      if (!modifierFn) return aliasedAssociationName
      const modifier = modifierFn(associationName, dreamClassAndAssociationNameTuple[0])
      if (modifier === 'omit') return undefined
      return [aliasedAssociationName, modifier]
    })
  )
}
