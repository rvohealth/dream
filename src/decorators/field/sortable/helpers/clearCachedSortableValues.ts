import Dream from '../../../../Dream.js'
import { SortableFieldConfig } from '../Sortable.js'
import sortableCacheValuesName from './sortableCacheValuesName.js'
import { clearSortableSnapshot } from './sortableSnapshot.js'

export default function clearCachedSortableValues(dream: Dream, positionField: string) {
  const cachedValuesName = sortableCacheValuesName(positionField)

  ;(dream as any)[cachedValuesName] = undefined
}

/**
 * @internal
 *
 * Discards both halves of what a save's sortable phase stashes on the
 * instance: the cached values the position work reads, and the snapshot of the
 * row it would have computed its shift against. The position work clears them
 * itself as it consumes them, so this is for the paths where it does not run —
 * the row was already gone when the snapshot read found it, or the save's
 * transaction rolled back — leaving a later save of the same instance to read
 * the row for itself rather than inherit this save's reading of it.
 */
export function clearSortableSaveState(dream: Dream, configs: SortableFieldConfig[]) {
  for (const { positionField } of configs) {
    clearCachedSortableValues(dream, positionField)
    clearSortableSnapshot(dream, positionField)
  }
}
