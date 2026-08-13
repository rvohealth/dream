import Dream from '../../../../Dream.js'
import { SortableFieldConfig } from '../Sortable.js'
import sortableScopeLockKey from './sortableScopeLockKey.js'
import { sortableScopeValues } from './sortableScopeColumns.js'
import { snapshotScopeValue, SortableSnapshots } from './sortableSnapshot.js'

/**
 * @internal
 *
 * The single key for the scope the record currently occupies — the scope its
 * position is about to be computed within. Used by the position write itself,
 * where the record already carries its final scope values.
 */
export function sortableScopeLockKeyForCurrentScope(
  dream: Dream,
  positionField: string,
  scope: string | string[] | undefined
): bigint {
  return sortableScopeLockKey(
    dream,
    positionField,
    sortableScopeValues(dream, scope, column => (dream as any)[column])
  )
}

/**
 * @internal
 *
 * Every key a create's position work needs — one per sortable field, derived
 * from the scope values the row now carries — sorted and deduplicated, so that
 * a multi-sortable-field create acquires in the same global order as every
 * other position-mutating operation. Declaration order cannot serve: the keys
 * hash the runtime scope values, so which field's key sorts first varies from
 * record to record.
 */
export function sortableCurrentScopeLockKeys(dream: Dream, configs: SortableFieldConfig[]): bigint[] {
  return sortedUniqueKeys(
    configs.map(({ positionField, scope }) =>
      sortableScopeLockKeyForCurrentScope(dream, positionField, scope)
    )
  )
}

/**
 * @internal
 *
 * Every key a per-record position-mutating operation needs, sorted and
 * deduplicated. A save that moves a record between sort scopes compacts the
 * scope it leaves and makes room in the scope it enters, so it needs both keys;
 * a save within one scope needs one, and so do a destroy and an undestroy, which
 * write no scope values at all.
 *
 * The *new*-scope key comes from the values being written. The *old*-scope key
 * comes from the database snapshot of the record's physical scope columns when
 * one is available, and only falls back to the instance's pending changes when
 * it is not — which is the case exactly once per save, on the first
 * acquisition, because the snapshot cannot be read until something is locked.
 * The caller closes that window by re-reading under the lock and calling this
 * again with the snapshot; see `acquireStabilizedSortableScopeLocks`.
 *
 * A pending change is only an *old* scope when it has a previous persisted
 * value. A record created earlier in this process reports every column as
 * changed with `was === undefined` (`Dream#changes` compares against the
 * pre-save state), which is not a scope the row was ever in: reading it as one
 * would take a second, bogus lock — and, since every such record produces the
 * same all-null scope tuple, it would be the *same* bogus key for every record
 * in the table, serializing writers that touch unrelated scopes.
 *
 * Either way this must be called *before* the driver write overwrites the
 * record's scope columns.
 */
export function sortableSaveLockKeys(
  dream: Dream,
  configs: SortableFieldConfig[],
  snapshots: SortableSnapshots = new Map()
): bigint[] {
  const keys = configs.flatMap(({ positionField, scope }) => {
    const newScopeKey = sortableScopeLockKey(
      dream,
      positionField,
      sortableScopeValues(dream, scope, column => (dream as any)[column])
    )

    if (!dream.isPersisted) return [newScopeKey]

    const changes: Record<string, { was: unknown } | undefined> = dream.changes()
    const snapshot = snapshots.get(positionField)

    const oldScopeKey = sortableScopeLockKey(
      dream,
      positionField,
      sortableScopeValues(dream, scope, column =>
        snapshotScopeValue(snapshot, column, () => {
          const previousValue = changes[column]?.was
          return previousValue === undefined ? (dream as any)[column] : previousValue
        })
      )
    )

    return [newScopeKey, oldScopeKey]
  })

  return sortedUniqueKeys(keys)
}

function sortedUniqueKeys(keys: bigint[]): bigint[] {
  return [...new Set(keys)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}
