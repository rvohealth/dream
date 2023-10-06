import Dream from '../../../dream'
import Query from '../../../dream/query'
import positionIsInvalid from '../helpers/positionIsInvalid'
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

  if (!dream.willSaveChangeToAttribute(positionField)) return

  const position = (dream as any)[positionField]

  if (await positionIsInvalid({ query, dream: dream, scope, position })) {
    if (dream.isPersisted) {
      ;(dream as any)[positionField] = undefined
      return
    } else {
      ;(dream as any)[cacheKey] = dream.changes()[positionField]?.was
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
