import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Dream from '../../../../Dream.js'
import { SortableFieldConfig } from '../Sortable.js'
import restoreSortableScopePositions from './restoreSortableScopePositions.js'
import { SortableCascadeEdge } from './sortableCascadeEdge.js'
import sortableScopeColumns from './sortableScopeColumns.js'
import { readSortableSnapshots, snapshotScopeValue, SortableSnapshot } from './sortableSnapshot.js'

/**
 * @internal
 *
 * One sort scope this association's restore put at least one row into, and every
 * record it put there.
 */
interface PendingScopeRestore {
  /**
   * A record restored into this scope, standing in for all of them: it resolves
   * the table, the primary key, the model's default scopes and the scope's
   * columns, all of which every record in the entry shares.
   */
  dream: Dream
  positionField: string
  scope: string | string[] | undefined
  snapshot: SortableSnapshot | undefined
  restored: Dream[]
}

/**
 * @internal
 *
 * The sort scopes one `undestroyAssociation` call restored rows into, collected
 * while the call runs and renumbered once it finishes.
 *
 * A batch belongs to a single association edge. `undestroyAssociation` creates
 * one, `Query#undestroy` stamps it on every record it is about to restore
 * through that edge, each record's own undestroy adds the scopes it landed in,
 * and `undestroyAssociation` flushes it. Nothing outside that call can reach
 * it: a record restored a level deeper carries the batch of the association
 * that reached *it*, and a hook that starts an undestroy of its own builds its
 * own batches. There is therefore no shared state between cascades, no flush
 * ownership to decide, and nothing a frame can collect that another frame has
 * to remember to write.
 */
export default class SortableScopeRestoreBatch {
  private readonly pending = new Map<string, PendingScopeRestore>()

  /**
   * @param cascadeEdge - the association being restored through, which decides
   *   (via `cascadeCoversWholeSortScope`) which of a restored record's sortable
   *   fields are optimistic and therefore collected here. It travels with the
   *   batch so that a record can never be planned optimistic without a batch to
   *   collect it: `Query#undestroy` stamps both markers or neither.
   * @param txn - the transaction the restore runs in
   */
  constructor(
    public readonly cascadeEdge: SortableCascadeEdge,
    private readonly txn: DreamTransaction<any>
  ) {}

  /**
   * Records that this record was restored into the sort scopes of the given
   * fields, so that the flush can renumber each of those scopes once.
   *
   * Many restored records share one scope — that is the ordinary shape of a
   * cascade — so the entries are deduplicated on the scope the row *physically*
   * occupies, read here rather than taken from the in-memory instance: another
   * writer may have moved the row between scopes while it was soft deleted, and
   * two records of one restore can land in different scopes of the same field.
   *
   * @param dream - the record just restored
   * @param configs - the sortable fields positioned optimistically, from
   *   `planSortableUndestroyWork`
   */
  public async add(dream: Dream, configs: SortableFieldConfig[]): Promise<void> {
    if (!configs.length) return

    const { snapshots } = await readSortableSnapshots(dream, this.txn, configs)

    for (const { positionField, scope } of configs) {
      const snapshot = snapshots.get(positionField)
      const key = pendingScopeRestoreKey(dream, positionField, scope, snapshot)

      let entry = this.pending.get(key)

      if (entry === undefined) {
        entry = { dream, positionField, scope, snapshot, restored: [] }
        this.pending.set(key, entry)
      }

      entry.restored.push(dream)
    }
  }

  /**
   * Renumbers every scope this restore put a row into, one statement each, and
   * then refreshes the positions the restored instances hold in memory.
   *
   * The refresh is what keeps the transient NULL inside the transaction. A
   * restored record's own `afterUpdate` hook and its own reload both ran before
   * this point and saw NULL — deliberately, and documented — but its
   * `afterUpdateCommit` hook runs after the transaction commits
   * (`DreamTransaction#runAfterCommitHooks`, called by the query driver once
   * `transaction().execute()` resolves) against the very same instance. Without
   * this refresh that hook, and any instance outliving the call, would read a
   * NULL position for a row that has a real one.
   *
   * A single pass empties it. The only code that can add to a batch is the
   * undestroy of a record stamped with it, and every such record's undestroy
   * has returned by the time the association call flushes; everything below is
   * a statement or an in-memory assignment, and no model hook.
   */
  public async flush(): Promise<void> {
    if (!this.pending.size) return

    const entries = [...this.pending.values()]
    this.pending.clear()

    for (const entry of entries) {
      await restoreSortableScopePositions(
        entry.dream,
        this.txn,
        entry.positionField,
        entry.scope,
        entry.snapshot
      )
      await this.refreshRestoredPositions(entry)
    }

    for (const dream of new Set<Dream>(entries.flatMap(entry => entry.restored))) {
      // exactly what `reload` does once it has set the fresh values, so a
      // refreshed position does not read back as an unsaved change
      dream['freezeAttributes']()
      dream['originalAttributes'] = dream.getAttributes()
    }
  }

  /**
   * Reads the positions this scope's statement just wrote back onto the
   * instances that were restored into it — **one query for the whole scope**, so
   * the flush stays proportional to the number of scopes rather than the number
   * of records, which is the entire point of positioning them together.
   *
   * It reaches only the instances this restore itself produced. An instance the
   * caller obtained by another route — a preloaded association, a copy loaded
   * before the call — is a different object the cascade never touches, and is as
   * stale after an undestroy as it was before this change. Anything that needs a
   * restored record's position reloads it.
   */
  private async refreshRestoredPositions(entry: PendingScopeRestore): Promise<void> {
    const primaryKey = entry.dream['_primaryKey']
    const primaryKeyValues = entry.restored.map(dream => dream.primaryKeyValue())

    const rows = (await this.txn.kyselyTransaction
      .selectFrom(entry.dream.table as any)
      .where(primaryKey, 'in', primaryKeyValues)
      .select([primaryKey, entry.positionField] as any)
      .execute()) as Record<string, unknown>[]

    const positionsByPrimaryKey = new Map(
      rows.map(row => [String(row[primaryKey]), row[entry.positionField]])
    )

    for (const dream of entry.restored) {
      const position = positionsByPrimaryKey.get(String(dream.primaryKeyValue()))
      if (position === undefined) continue
      dream.setAttributes({ [entry.positionField]: position } as any)
    }
  }
}

/**
 * @internal
 *
 * The batch a cascaded undestroy collects a record's restored sort scopes into.
 *
 * Carried on the instance rather than through `Dream#undestroy`'s options, for
 * the same reason the cascade edge is: the undestroy cascade re-enters through
 * a Query, and the options both `Dream#undestroy` and `Query#undestroy` speak
 * are public. It follows the `SORTABLE_CASCADE_EDGE` marker in every other
 * respect — a plain symbol-keyed assignment, already excluded from
 * `Object.keys`, `for...in` and `JSON.stringify`.
 */
const SORTABLE_SCOPE_RESTORE_BATCH = Symbol.for('dream:sortableScopeRestoreBatch')

/**
 * @internal
 *
 * Records the batch this record's restored sort scopes belong to.
 */
export function markSortableScopeRestoreBatch(dream: Dream, batch: SortableScopeRestoreBatch): void {
  ;(dream as any)[SORTABLE_SCOPE_RESTORE_BATCH] = batch
}

/**
 * @internal
 *
 * Reads the batch off the instance and removes it, so that one undestroy
 * consumes it exactly once. Leaving it behind would let a later direct
 * undestroy of the same instance collect into a batch nobody is going to flush,
 * which is the one way this marker could strand a position.
 *
 * @returns the batch to collect this record's restored scopes into, or null
 *   when this is a direct undestroy
 */
export function consumeSortableScopeRestoreBatch(dream: Dream): SortableScopeRestoreBatch | null {
  const batch = (dream as any)[SORTABLE_SCOPE_RESTORE_BATCH] as SortableScopeRestoreBatch | undefined
  if (batch === undefined) return null
  delete (dream as any)[SORTABLE_SCOPE_RESTORE_BATCH]
  return batch
}

/**
 * The identity of a sort scope for deduplication: the table, the model class,
 * the position column, and the scope column values the row physically carries.
 *
 * The class is part of the key rather than assumed away because two STI
 * siblings sharing a table can carry different default scopes, and the
 * statement is built from one record's class. Two siblings restored into one
 * scope therefore renumber it once each — idempotently, and still once per
 * class rather than once per record.
 *
 * The members are encoded structurally, as `sortableScopeLockKey` and
 * `resortAllRecords`' own scope identity encode theirs: a JSON array is
 * unambiguous over its members, where any joined form would need a delimiter no
 * member could contain. Two different scope tuples therefore cannot produce one
 * key — JSON escapes every member, and the array brackets and commas record
 * both the arity and the boundaries the members themselves cannot forge.
 */
function pendingScopeRestoreKey(
  dream: Dream,
  positionField: string,
  scope: string | string[] | undefined,
  snapshot: SortableSnapshot | undefined
): string {
  const scopeValues = sortableScopeColumns(dream, scope).map(column =>
    serializeScopeValue(snapshotScopeValue(snapshot, column, () => (dream as any)[column]))
  )

  return JSON.stringify([dream.table, dream.constructor.name, positionField, scopeValues])
}

/**
 * A scope value rendered so two different values cannot collide into one key.
 * Scope members are foreign keys and plain columns, so they arrive as strings,
 * numbers, booleans, dates or null; anything else falls back to JSON, and a
 * value that will not serialize gets a key of its own rather than a shared one.
 */
function serializeScopeValue(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (value instanceof Date) return `date:${value.toISOString()}`

  switch (typeof value) {
    case 'string':
      return `string:${value}`
    case 'number':
    case 'bigint':
    case 'boolean':
      return `${typeof value}:${value.toString()}`
    default:
      try {
        return `json:${JSON.stringify(value)}`
      } catch {
        return `unserializable:${uniqueScopeValueKey++}`
      }
  }
}

let uniqueScopeValueKey = 0
