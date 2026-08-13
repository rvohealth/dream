import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import pascalize from '../../../../helpers/pascalize.js'
import { SortableFieldConfig } from '../Sortable.js'
import sortableScopeColumns from './sortableScopeColumns.js'
import { takeCachedSortableRow } from './sortableRowCache.js'

/**
 * @internal
 *
 * What a sortable position-mutating path knows about the row as it physically
 * exists, rather than as the in-memory instance remembers it.
 *
 * `position` is the row's real position; `scopeValues` are the row's real sort
 * scope column values, keyed by column. An instance loaded before another
 * writer moved the row carries neither.
 */
export interface SortableSnapshot {
  position: number | null
  scopeValues: Map<string, unknown>
}

/**
 * @internal
 *
 * Snapshots keyed by position field — a model may declare several sortable
 * fields, each with its own scope and its own position space.
 */
export type SortableSnapshots = Map<string, SortableSnapshot>

/**
 * @internal
 *
 * The outcome of a snapshot read: the snapshots themselves, plus whether the
 * row was physically there to read.
 *
 * The two are deliberately separate. An empty `snapshots` map means only "no
 * snapshot is available", which the model having no sortable fields produces
 * just as readily as a row another writer has already deleted — and a caller
 * that reads absence out of the empty map compacts a scope this operation never
 * vacated.
 */
export interface SortableSnapshotRead {
  /**
   * False only when a read positively found no row. A read that never had to
   * run — a model with no sortable fields — reports true, since it observed
   * nothing.
   */
  rowExists: boolean
  snapshots: SortableSnapshots
}

/**
 * @internal
 *
 * Reads the record's real position and sort scope column values straight from
 * the row, inside the given transaction.
 *
 * The read deliberately bypasses Dream's default scopes and goes to the table
 * by primary key: soft-deleted rows have to be readable here (undestroy reads
 * one), and an STI child's row is the same physical row whatever scope the
 * class carries.
 *
 * When the row is not there the snapshots are empty and `rowExists` is false;
 * a caller that goes on to compute a shift falls back to the instance, which is
 * the pre-existing behavior.
 *
 * @param dream - the record to snapshot
 * @param txn - the transaction the read runs in; the read must be protected by
 *   whatever scope lock the caller holds in that transaction
 * @param configs - the sortable fields whose position and scope columns to read
 */
export async function readSortableSnapshots(
  dream: Dream,
  txn: DreamTransaction<any>,
  configs: SortableFieldConfig[]
): Promise<SortableSnapshotRead> {
  const snapshots: SortableSnapshots = new Map()
  if (!configs.length) return { rowExists: true, snapshots }

  const scopeColumnsByPositionField = new Map<string, string[]>()
  const columns = new Set<string>()

  for (const { positionField, scope } of configs) {
    columns.add(positionField)

    const scopeColumns = sortableScopeColumns(dream, scope)

    scopeColumns.forEach(column => columns.add(column))
    scopeColumnsByPositionField.set(positionField, scopeColumns)
  }

  // A locked batch's preflight already read this row, in this transaction and
  // under these locks, to derive the batch's key set — asking again would be
  // the same question of the same row. The cached row is handed over once and
  // is dropped by every position write in the transaction, so a record an
  // earlier record's compaction may have moved reads its row again.
  const cachedRow = takeCachedSortableRow(txn, dream.table, dream.primaryKeyValue())

  const row =
    cachedRow && [...columns].every(column => column in cachedRow)
      ? cachedRow
      : ((await txn.kyselyTransaction
          .selectFrom(dream.table as any)
          .where(dream['_primaryKey'], '=', dream.primaryKeyValue())
          .select([...columns])
          .executeTakeFirst()) as Record<string, unknown> | undefined)

  if (row === undefined) return { rowExists: false, snapshots }

  for (const [positionField, scopeColumns] of scopeColumnsByPositionField) {
    snapshots.set(positionField, {
      position: (row[positionField] as number | null | undefined) ?? null,
      scopeValues: new Map(scopeColumns.map(column => [column, row[column] ?? null])),
    })
  }

  return { rowExists: true, snapshots }
}

function sortableSnapshotName(positionField: string) {
  return `_sortableSnapshotFor${pascalize(positionField)}`
}

/**
 * @internal
 *
 * Stashes snapshots on the instance so the hook that computes the shift can
 * reach the read the earlier phase made. The read and the shift are separated
 * by a hook boundary on every path — `beforeDestroy` to `afterDestroy`, the
 * `saveDream` sortable phase to `afterUpdate` — and the instance is what
 * crosses it.
 */
export function cacheSortableSnapshots(dream: Dream, snapshots: SortableSnapshots) {
  for (const [positionField, snapshot] of snapshots) {
    ;(dream as any)[sortableSnapshotName(positionField)] = snapshot
  }
}

/**
 * @internal
 */
export function sortableSnapshotFor(dream: Dream, positionField: string): SortableSnapshot | undefined {
  return (dream as any)[sortableSnapshotName(positionField)] as SortableSnapshot | undefined
}

/**
 * @internal
 */
export function clearSortableSnapshot(dream: Dream, positionField: string) {
  ;(dream as any)[sortableSnapshotName(positionField)] = undefined
}

/**
 * @internal
 *
 * The value to filter a sort scope column by: the row's real value when a
 * snapshot is available, and the caller's own fallback when it is not.
 */
export function snapshotScopeValue(
  snapshot: SortableSnapshot | undefined,
  column: string,
  fallback: () => unknown
): unknown {
  if (snapshot?.scopeValues.has(column)) return snapshot.scopeValues.get(column)
  return fallback()
}
