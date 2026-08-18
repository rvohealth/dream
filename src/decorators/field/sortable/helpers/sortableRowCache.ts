import DreamTransaction from '../../../../dream/DreamTransaction.js'

// The cached rows of every live transaction, keyed by the `DreamTransaction`
// object itself. Module-level state is safe here because the key is an object
// identity: every transaction — including a nested one — is its own
// `DreamTransaction` instance, so no lookup can ever see rows stashed by
// another transaction, whatever request or async flow it belongs to. The keys
// are held weakly, so an entry becomes collectible with its transaction and
// nothing accumulates for the life of the process. (The lock ledger in
// `heldSortableScopeLockKeys.ts` relies on the same properties.)
const rowsByTransaction = new WeakMap<DreamTransaction<any>, Map<string, Record<string, unknown>>>()

// a JSON tuple rather than a joined string, so that no table name and no
// primary key value can combine into another pair's key
function cacheKey(table: string, primaryKeyValue: unknown): string {
  return JSON.stringify([table, String(primaryKeyValue)])
}

/**
 * @internal
 *
 * Stashes rows a locked batch's preflight read under the batch's scope locks,
 * so that the per-record position work that follows does not read them a second
 * time. The preflight reads every candidate's position and sort scope columns
 * to derive the key set; each record's own snapshot read then asks the same
 * question of the same row, in the same transaction, under the same locks.
 *
 * Called once per preflight, with the rows of the pass that converged: an
 * earlier pass read before some of the locks were held, and a preflight that
 * raised holds no lock the rest of the transaction can rely on. The rows are
 * consumed one at a time and the whole entry is dropped by the first position
 * write of the batch, since a compaction moves rows this holds stale positions
 * for — so what it saves is the snapshot reads of the records walked before
 * that first write.
 *
 * @param txn - the batch's transaction
 * @param table - the table the rows came from
 * @param primaryKey - the column the rows are keyed by
 * @param rows - the rows read, carrying at least the position and scope columns
 */
export function cacheSortableRowsReadUnderLock(
  txn: DreamTransaction<any>,
  table: string,
  primaryKey: string,
  rows: Record<string, unknown>[]
) {
  rowsByTransaction.set(txn, new Map(rows.map(row => [cacheKey(table, row[primaryKey]), row])))
}

/**
 * @internal
 *
 * The cached row for one record, removed from the cache as it is handed over.
 *
 * Consuming is destructive because the consumer is a position-mutating
 * operation: it is about to compact or renumber the scope the row sits in, and
 * a second read of the same cached row would see the position the row had
 * before that. {@link invalidateSortableRowCache} covers the same hazard for
 * the *other* records a compaction moves.
 */
export function takeCachedSortableRow(
  txn: DreamTransaction<any>,
  table: string,
  primaryKeyValue: unknown
): Record<string, unknown> | undefined {
  const rows = rowsByTransaction.get(txn)
  if (!rows) return undefined

  const key = cacheKey(table, primaryKeyValue)
  const row = rows.get(key)
  rows.delete(key)
  return row
}

/**
 * @internal
 *
 * Discards everything cached for this transaction. Called for two reasons: a
 * position write just moved rows the cache cannot identify — a compaction
 * shifts every row in one sort scope above a position, and the cache holds no
 * index by scope — and the batch the rows were read for has finished, after
 * which they describe nothing the rest of a caller-owned transaction should
 * trust. The records still to be walked read their own rows again, which is
 * what they did before the cache existed.
 */
export function invalidateSortableRowCache(txn: DreamTransaction<any>) {
  rowsByTransaction.delete(txn)
}
