import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import SortableBatchRequiresTooManyScopeLocks from '../../../../errors/SortableBatchRequiresTooManyScopeLocks.js'
import { SortableFieldConfig } from '../Sortable.js'
import heldSortableScopeLockKeys from './heldSortableScopeLockKeys.js'
import sortableScopeLockKey from './sortableScopeLockKey.js'
import { cacheSortableRowsReadUnderLock } from './sortableRowCache.js'
import { sortableScopeColumnPairs } from './sortableScopeColumns.js'
import stabilizeSortableScopeLocks from './stabilizeSortableScopeLocks.js'

/**
 * The most advisory sort-scope locks a batch preflight will let one transaction
 * hold.
 *
 * Advisory locks are entries in a cluster-wide shared lock table sized at
 * startup (`max_locks_per_transaction` × `max_connections`, 6400 entries under
 * the stock settings), and a transaction holds every key it takes until it
 * ends. `batchSize` is the caller's to choose and nothing bounds the number of
 * distinct sort scopes a batch's records span, so without a limit a wide enough
 * batch over a high-cardinality scope can starve every other connection in the
 * cluster of a resource they all draw on — a failure that lands on unrelated
 * transactions rather than on the one that caused it.
 *
 * The count is **cumulative over the transaction**: each preflight round counts
 * the keys the transaction already holds together with the keys that round
 * would add. So the bound holds across the rounds of one stabilization loop
 * (each of which can discover a different set of scopes), and across the
 * batches of a multi-batch run inside a caller-owned transaction, where
 * advisory locks are released only when the caller commits.
 *
 * The headroom this leaves: the locked-batch defaults are ten records per batch
 * (`Query.BATCH_SIZES.LOCKED_DESTROY` / `LOCKED_UPDATE`), so reaching the bound
 * takes a caller who raises `batchSize` by two orders of magnitude and whose
 * records each occupy a sort scope of their own — or a long run of such batches
 * inside one transaction. Two shapes consume the budget faster than one key per
 * record: a model declaring more than one sortable field needs one key per
 * field, and the attribute form of `update` needs up to two per record per
 * field, since the record's current scope and its destination scope are
 * different keys.
 *
 * Only the batch preflight enforces this. A per-record save, destroy or
 * undestroy takes its keys without counting them, so what they take is counted
 * by the next preflight in the same transaction but cannot itself raise.
 */
export const MAX_SORTABLE_BATCH_SCOPE_LOCKS = 1000

/**
 * @internal
 *
 * The operation-level scope-lock preflight for the batched, row-locking query
 * APIs — `Query#destroy({ lock: true })` and the attribute form of
 * `Query#update(attributes, { lock: true })`.
 *
 * Why it exists: those operations take *row* locks (`takeAll({ lock: true })`)
 * and then run per-record sortable work that takes *advisory* scope locks. Two
 * transactions running in that order can each hold what the other is waiting
 * for. Acquiring every advisory key the batch needs — across every sortable
 * field and every candidate record — in one sorted pass, before a single row is
 * claimed, removes the inversion: the advisory locks are always taken first, and
 * always in the same order.
 *
 * The key set cannot simply be read once: `Query.lockedBatches` plucks only
 * primary keys, so the candidates' scope columns have to be read separately, and
 * that first read is not protected by any lock. So the read is stabilized the
 * same way the per-record paths stabilize theirs, through the same
 * `stabilizeSortableScopeLocks` protocol — acquire on what the unlocked read
 * implies, re-read under those locks, take any additional key the re-read
 * reveals — with the same bound, and the same `SortableScopeDidNotStabilize`
 * when a batch of rows keeps moving between scopes faster than it can be read.
 *
 * A model with no sortable fields never reaches the driver seam, so this is
 * inert — and free — for every other model.
 *
 * How many keys the transaction may hold is bounded — see
 * {@link MAX_SORTABLE_BATCH_SCOPE_LOCKS} — and a batch that would carry it past
 * the bound is refused before it claims any row. The first round refuses before
 * anything at all is locked; a later round refuses after that loop's earlier
 * rounds took their keys, which stay held until the transaction ends like every
 * advisory lock this branch takes.
 *
 * What the preflight can and cannot see: `incomingScopeValue` recognizes an
 * attribute that names a scope column directly or the BelongsTo association
 * backing it. A destination scope produced any other way — by a custom setter,
 * a virtual attribute, or a `beforeSave` hook that moves the record between
 * scopes during the per-record save — is invisible here, and those shapes are
 * preflight fallbacks like the callback form of `update` and a multi-batch run
 * inside a caller-owned transaction: the missing key is taken as the
 * per-record save reaches it, after this batch's row locks, and the residual
 * failure is Postgres's `40P01` deadlock error — a visible, retryable failure
 * rather than a silent wrong ordering.
 *
 * @param dreamInstance - a bare instance of the Query's model, used for the
 *   table, the connection, and the scope column resolution
 * @param txn - the batch's transaction; the locks live until it ends
 * @param primaryKeyValues - the candidate records this batch will try to claim
 * @param incomingAttributes - the attributes the operation will write, when they
 *   are knowable before the claim (the attribute form of `update`); a scope
 *   column among them means the batch also needs the destination scope's key
 */
export default async function acquireStabilizedSortableBatchLocks(
  dreamInstance: Dream,
  txn: DreamTransaction<any>,
  primaryKeyValues: unknown[],
  incomingAttributes?: Record<string, unknown>
): Promise<void> {
  const configs = ((dreamInstance.constructor as typeof Dream)['sortableFields'] ??
    []) as SortableFieldConfig[]
  if (!configs.length || !primaryKeyValues.length) return

  const primaryKey = dreamInstance['_primaryKey']
  // `[scope member, column]` pairs, so that an incoming attribute naming the
  // BelongsTo association rather than its foreign key still lines up
  const scopeColumnsByPositionField = new Map<string, [string, string][]>()
  const columns = new Set<string>([primaryKey])

  for (const { positionField, scope } of configs) {
    const scopeColumns = sortableScopeColumnPairs(dreamInstance, scope)

    // the position columns are not part of the key derivation; they are read
    // because this read is the one the per-record work would otherwise repeat,
    // and a snapshot is a position as well as a sort scope
    columns.add(positionField)
    scopeColumns.forEach(([, column]) => columns.add(column))
    scopeColumnsByPositionField.set(positionField, scopeColumns)
  }

  // the live set of keys this transaction holds, which every acquisition adds
  // to: what the bound is counted against, so that neither a later round of
  // this loop nor a later batch of a caller-owned transaction can pass the
  // check a bound's worth at a time
  const heldKeys = heldSortableScopeLockKeys(txn)

  // the read of the pass that converged — taken under every lock this preflight
  // holds — published to the row cache once the loop is through
  let rowsReadUnderEveryLock: Record<string, unknown>[] = []

  // every pass re-reads the candidates: the first read is unprotected, and each
  // later one is taken under the locks the previous pass acquired
  await stabilizeSortableScopeLocks(dreamInstance, txn, async () => {
    const rows = (await txn.kyselyTransaction
      .selectFrom(dreamInstance.table as any)
      .where(primaryKey, 'in', primaryKeyValues)
      .select([...columns])
      .execute()) as Record<string, unknown>[]

    const keys = new Set<bigint>()

    for (const row of rows) {
      for (const config of configs) {
        const scopeColumns = scopeColumnsByPositionField.get(config.positionField)!

        keys.add(
          sortableScopeLockKey(
            dreamInstance,
            config.positionField,
            scopeColumns.map(([, column]) => [column, row[column] ?? null])
          )
        )

        if (incomingAttributes) {
          keys.add(
            sortableScopeLockKey(
              dreamInstance,
              config.positionField,
              scopeColumns.map(([singleScope, column]) => {
                const incoming = incomingScopeValue(incomingAttributes, singleScope, column)
                return [column, incoming === NOT_WRITTEN ? (row[column] ?? null) : incoming]
              })
            )
          )
        }
      }
    }

    // counted before this round acquires anything, and counted over everything
    // the transaction would hold once it had: the keys it already holds plus
    // the ones this round adds to them
    let keyCount = heldKeys.size
    for (const key of keys) if (!heldKeys.has(key)) keyCount++

    if (keyCount > MAX_SORTABLE_BATCH_SCOPE_LOCKS)
      throw new SortableBatchRequiresTooManyScopeLocks(
        dreamInstance['sanitizedConstructorName'],
        keyCount,
        MAX_SORTABLE_BATCH_SCOPE_LOCKS
      )

    rowsReadUnderEveryLock = rows

    return keys
  })

  // published only now the loop has converged, so that the rows the per-record
  // snapshots consume are the ones read under every lock the preflight holds —
  // and so that a preflight which raises publishes nothing. Neither failure
  // exit aborts the transaction, so a caller that catches one inside a
  // transaction of its own would otherwise go on to find rows here that no lock
  // of theirs protects.
  cacheSortableRowsReadUnderLock(txn, dreamInstance.table, primaryKey, rowsReadUnderEveryLock)
}

/**
 * Distinguishes "this operation does not write that scope column" from "this
 * operation writes null into it", which are different destination scopes.
 */
const NOT_WRITTEN = Symbol('sortable scope column not written by this operation')

/**
 * The value a scope column is about to be written with, or {@link NOT_WRITTEN}
 * when this operation does not touch it. A scope member can be named either by
 * its column (`{ userId: 3 }`) or by the BelongsTo association the column backs
 * (`{ user: someUser }`), and both forms reach `update` as attributes.
 */
function incomingScopeValue(
  incomingAttributes: Record<string, unknown>,
  singleScope: string,
  column: string
): unknown {
  if (Object.prototype.hasOwnProperty.call(incomingAttributes, column))
    return incomingAttributes[column] ?? null

  if (Object.prototype.hasOwnProperty.call(incomingAttributes, singleScope)) {
    const value = incomingAttributes[singleScope]
    return value instanceof Dream ? value.primaryKeyValue() : (value ?? null)
  }

  return NOT_WRITTEN
}
