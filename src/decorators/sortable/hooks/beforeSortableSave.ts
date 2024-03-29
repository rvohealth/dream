import Dream from '../../../dream'
import Query from '../../../dream/query'
import getColumnForSortableScope from '../helpers/getColumnForSortableScope'
import positionIsInvalid from '../helpers/positionIsInvalid'
import scopeArray from '../helpers/scopeArray'
import sortableCacheKeyName from '../helpers/sortableCacheKeyName'
import sortableCacheValuesName from '../helpers/sortableCacheValuesName'

export default async function beforeSortableSave({
  positionField,
  dream,
  query,
  scope,
}: {
  positionField: string
  dream: Dream
  query: Query<typeof Dream>
  scope?: string | string[]
}) {
  const cacheKey = sortableCacheKeyName(positionField)
  const cachedValuesName = sortableCacheValuesName(positionField)

  const savingChangeToScopeField = scopeArray(scope).filter(
    scopeField =>
      (!dream.getAssociation(scopeField) && dream.willSaveChangeToAttribute(scopeField as any)) ||
      (dream.getAssociation(scopeField) &&
        Object.keys(dream.changedAttributes()).includes(dream.getAssociation(scopeField)!.foreignKey()))
  ).length

  if (!dream.willSaveChangeToAttribute(positionField) && !savingChangeToScopeField) return

  const position = (dream as any)[positionField]

  if (await positionIsInvalid({ query, dream: dream, scope, position })) {
    if (savingChangeToScopeField) {
      ;(dream as any)[cacheKey] = dream.changes()[positionField]?.was
    } else {
      if (dream.isPersisted) {
        ;(dream as any)[positionField] = undefined
        return
      } else {
        ;(dream as any)[cacheKey] = dream.changes()[positionField]?.was
      }
    }
  } else {
    ;(dream as any)[cacheKey] = position
  }

  // store values to be used in after create/update hook
  const values = {
    position: (dream as any)[cacheKey],
    dream: dream,
    positionField,
    scope,
    previousPosition: dream.changes()[positionField]?.was,
    query,
  }
  ;(dream as any)[cachedValuesName] = values

  if (dream.isPersisted) {
    // if the dream is saved, set the position field to undefined, which will cause
    // the update cycle to ignore the position field. We will proceed to update it in an
    // AfterUpdateCommit hook
    ;(dream as any)[positionField] = undefined
  } else {
    // if the dream is not saved, set position to 0 to prevent collisions with existing position values.
    // it will be updated in an AfterCreateCommit hook to the correct value after saving.
    ;(dream as any)[positionField] = 0
  }
}
