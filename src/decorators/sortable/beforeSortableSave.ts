import Dream from '../../dream'
import Query from '../../dream/query'
import positionIsInvalid from './positionIsInvalid'

export default async function beforeSortableSave({
  positionField,
  dream,
  query,
  cacheKey,
  cachedValuesName,
  scope,
}: {
  positionField: string
  dream: Dream
  cacheKey: string
  cachedValuesName: string
  query: Query<typeof Dream>
  scope?: string
}) {
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

  // if the only change being saved is a change to position
  // we can apply position changes immediately, rather than waiting for after hooks to fire.
  const values = {
    position: (dream as any)[cacheKey],
    dream: dream,
    positionField,
    scope,
    previousPosition: dream.changes()[positionField]?.was,
    query,
  }
  ;(dream as any)[cachedValuesName] = values

  // if the previous value for dream field was null or undefined, make sure to
  // set to a real integer to prevent non-null violations at DB level
  if (dream.isPersisted) {
    ;(dream as any)[positionField] = undefined
  } else {
    ;(dream as any)[positionField] = 0
  }
}
