import Dream from '../../../Dream.js'
import Query from '../../../dream/Query.js'
import positionIsInvalid from '../helpers/positionIsInvalid.js'
import scopeArray from '../helpers/scopeArray.js'
import sortableCacheKeyName from '../helpers/sortableCacheKeyName.js'
import sortableCacheValuesName from '../helpers/sortableCacheValuesName.js'

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
  const dreamAsAny = dream as any

  const changingScope = scopeArray(scope).filter(scopeField =>
    dream['getAssociationMetadata'](scopeField)
      ? dream.willSaveChangeToAttribute(dream['getAssociationMetadata'](scopeField).foreignKey())
      : dream.willSaveChangeToAttribute(scopeField as any)
  ).length

  if (!dream.willSaveChangeToAttribute(positionField) && !changingScope) return

  const onlyChangingScope = !dream.willSaveChangeToAttribute(positionField) && changingScope

  const position = dreamAsAny[positionField]

  if (onlyChangingScope) {
    dreamAsAny[cacheKey] = position
  } else if (await positionIsInvalid({ query, dream: dream, scope, position })) {
    if (changingScope) {
      dreamAsAny[cacheKey] = dream.changes()[positionField]?.was
    } else {
      if (dream.isPersisted) {
        dreamAsAny[positionField] = undefined
        return
      } else {
        dreamAsAny[cacheKey] = dream.changes()[positionField]?.was
      }
    }
  } else {
    dreamAsAny[cacheKey] = position
  }

  // store values to be used in after create/update hook
  const values = {
    position: changingScope ? undefined : dreamAsAny[cacheKey],
    dream,
    positionField,
    scope,
    previousPosition: dream.willSaveChangeToAttribute(positionField)
      ? dream.changes()[positionField]?.was
      : changingScope
        ? position
        : undefined,
    query,
  }
  dreamAsAny[cachedValuesName] = values

  if (dream.isNewRecord || changingScope) {
    // if the dream is not saved, or is being moved between scopes, set position to 0
    // to prevent collisions with existing position values.
    // it will be updated in an AfterCreateCommit hook to the correct value after saving.
    dreamAsAny[positionField] = 0
  } else {
    // if the dream is saved, set the position field to undefined, which will cause
    // the update cycle to ignore the position field. We will proceed to update it in an
    // AfterUpdateCommit hook
    dreamAsAny[positionField] = undefined
  }
}
