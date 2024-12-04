import Dream from '../../../Dream'
import Query from '../../../dream/Query'
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
  query: Query<Dream>
  scope?: string | string[]
}) {
  const cacheKey = sortableCacheKeyName(positionField)
  const cachedValuesName = sortableCacheValuesName(positionField)

  const savingChangeToScopeField = scopeArray(scope).filter(
    scopeField =>
      (!dream['getAssociationMetadata'](scopeField) && dream.willSaveChangeToAttribute(scopeField as any)) ||
      (dream['getAssociationMetadata'](scopeField) &&
        Object.keys(dream.changedAttributes()).includes(
          dream['getAssociationMetadata'](scopeField).foreignKey()
        ))
  ).length

  if (!dream.willSaveChangeToAttribute(positionField) && !savingChangeToScopeField) return

  const position = (dream as any)[positionField]
  const onlySavingChangeToScopeField =
    !dream.willSaveChangeToAttribute(positionField) && savingChangeToScopeField

  if (await positionIsInvalid({ query, dream: dream, scope, position })) {
    if (onlySavingChangeToScopeField) {
      console.log('AAAAA')
      ;(dream as any)[cacheKey] = undefined
    } else if (savingChangeToScopeField) {
      console.log('BBBBB', position)
      ;(dream as any)[cacheKey] = dream.changes()[positionField]?.was
    } else {
      console.log('CCCCC')
      if (dream.isPersisted) {
        ;(dream as any)[positionField] = undefined
        return
      } else {
        ;(dream as any)[cacheKey] = dream.changes()[positionField]?.was
      }
    }
  } else {
    console.log('DDDDD')
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
    onlySavingChangeToScopeField,
  }
  ;(dream as any)[cachedValuesName] = values

  if (dream.isPersisted) {
    // if the dream is saved, set the position field to undefined, which will cause
    // the update cycle to ignore the position field. We will proceed to update it in an
    // AfterUpdateCommit hook
    ;(dream as any)[positionField] = onlySavingChangeToScopeField ? 0 : undefined
  } else {
    // if the dream is not saved, set position to 0 to prevent collisions with existing position values.
    // it will be updated in an AfterCreateCommit hook to the correct value after saving.
    ;(dream as any)[positionField] = 0
  }
}
