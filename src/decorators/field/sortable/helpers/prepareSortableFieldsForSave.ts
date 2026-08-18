import Dream from '../../../../Dream.js'
import { SortableFieldConfig } from '../Sortable.js'
import positionIsInvalid from './positionIsInvalid.js'
import sortableCacheValuesName from './sortableCacheValuesName.js'

export interface SortableCache {
  changingScope: boolean
  position: number | undefined
  previousPosition: number | undefined
  wasNewRecord: boolean
}

/**
 * @internal
 *
 * The sortable preparation phase of a save. Called from `saveDream` after every
 * consumer before-hook has run — a phase, not a hook among them — so the
 * decision is made from the final state of the instance: a position or scope
 * change introduced by a `beforeSave` hook registered after Sortable's gets the
 * same handling as one made before `save` was called, and a cache is never
 * carried over from a state an intervening hook has made stale.
 *
 * For each sortable field this caches the values the position work needs and
 * applies the position sentinel, then returns the fields whose position work
 * this save will perform — the fields that make the save need a transaction of
 * its own, so that the write and the position write that follows it commit
 * together under one scope lock.
 *
 * - every create on a model with sortable fields performs position work;
 * - an update performs it only when the save changes the position or one of the
 *   sortable scope columns.
 *
 * A save that skips hooks performs no position work at all, so it needs no
 * transaction.
 */
export default function prepareSortableFieldsForSave(
  dream: Dream,
  { alreadyPersisted, skipHooks }: { alreadyPersisted: boolean; skipHooks: boolean }
): SortableFieldConfig[] {
  if (skipHooks) return []

  const sortableFields = (dream.constructor as typeof Dream)['sortableFields'] as SortableFieldConfig[]
  if (!sortableFields.length) return []

  sortableFields.forEach(config => prepareSortableFieldForSave(dream, config))

  if (!alreadyPersisted) return [...sortableFields]

  return sortableFields.filter(
    config => (dream as any)[sortableCacheValuesName(config.positionField)] !== undefined
  )
}

/**
 * Caches the values one sortable field's position work needs and applies the
 * position sentinel to the instance, so that the driver write never commits a
 * caller-supplied position the scope has not made room for.
 */
function prepareSortableFieldForSave(dream: Dream, { positionField, scope }: SortableFieldConfig) {
  const cachedValuesName = sortableCacheValuesName(positionField)
  const dreamAsAny = dream as any

  const changingScope =
    dream.isPersisted &&
    scope.filter(scopeField => {
      const association = dream['getAssociationMetadata'](scopeField)

      return association
        ? dream.willSaveChangeToAttribute(association.foreignKey())
        : dream.willSaveChangeToAttribute(scopeField as any)
    }).length > 0

  if (dream.willSaveChangeToAttribute(positionField) || changingScope) {
    const position = dreamAsAny[positionField]

    // store values to be used by the position work later in the save
    const values: SortableCache = {
      wasNewRecord: dream.isNewRecord,
      changingScope,
      position: positionIsInvalid(position) ? undefined : position,
      previousPosition:
        dream.isPersisted && dream.willSaveChangeToAttribute(positionField)
          ? dream.changes()[positionField]?.was
          : changingScope
            ? position
            : undefined,
    }
    dreamAsAny[cachedValuesName] = values
  } else {
    // computed from the final state of the instance, so a cache from an earlier,
    // now-stale state must not survive this decision
    dreamAsAny[cachedValuesName] = undefined
  }

  if (dream.isNewRecord || changingScope) {
    // if the dream is not saved, or is being moved between scopes, set position to 0
    // to prevent collisions with existing position values.
    // the real position is computed and written under the scope lock later in the save.
    dreamAsAny[positionField] = 0
  } else if (dream.willSaveChangeToAttribute(positionField)) {
    // if the dream is saved and the position is being changed, set the position field to
    // undefined, which will cause the update cycle to ignore the position field. The
    // position work later in the save writes the real value.
    dreamAsAny[positionField] = undefined
  }
}
