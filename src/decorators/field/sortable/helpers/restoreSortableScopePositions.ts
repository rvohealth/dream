import { sql } from 'kysely'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Dream from '../../../../Dream.js'
import { STI_SCOPE_NAME } from '../../../class/STI.js'
import filterQueryToScopeValues from './filterQueryToScopeValues.js'
import { snapshotScopeValue, SortableSnapshot } from './sortableSnapshot.js'

/**
 * The alias and column names the restoring UPDATE joins its `row_number()`
 * subquery on, namespaced so no real column of the table can collide with them.
 */
const RESTORE_ALIAS = 'dream_restore_renumber'
const RESTORE_PRIMARY_KEY = 'dream_restore_primary_key'
const RESTORE_POSITION = 'dream_restore_position'

/**
 * @internal
 *
 * Positions every row an undestroy cascade restored into one sort scope —
 * without taking that scope's advisory lock.
 *
 * **One idempotent statement per scope, run once the association that restored
 * the scope's rows has finished restoring them**, however many rows that was.
 * It ranks the scope's live rows by `row_number() over (order by position asc NULLS LAST, primary
 * key asc)`. **Nulls last is what makes this order-preserving**, and it is the
 * one difference from the `renumberScope` statement `resort` runs, which ranks
 * nulls *first* on purpose: there a null position is a defect to pull to the
 * front, here it is a row being restored. Live incumbents already running 1..k
 * therefore rank 1..k, come out unchanged, and are skipped by the
 * `is distinct from` guard; the restored rows carry NULL, sort after them in
 * primary-key order, and take k+1..n — which is exactly what the repeated
 * `coalesce(max(position), 0) + 1` this replaces produces, without the lock
 * that expression needs to be safe.
 *
 * A write that committed into the scope *before* it runs is absorbed — ranked
 * along with everything else, so it cannot collide. A write that commits inside
 * the window between it and COMMIT is not excluded at all: no scope lock is
 * held, and the `is distinct from` guard below leaves every already-correct row
 * unwritten and so unlocked, so any writer — a direct destroy as readily as a
 * cascaded one — can land in that window. What the write costs depends on
 * whether it leaves two live rows of the scope sharing a position. If it does,
 * the scope's deferrable unique constraint aborts the whole undestroy at
 * commit, with nothing half-restored and no commit hooks run, and the retry
 * absorbs that write like any other. If it does not — a direct destroy nulls
 * the position it frees and compacts only rows this statement never wrote — the
 * undestroy commits and the scope can be left with a gap, which
 * `Model.resort` closes.
 *
 * Because it runs once for the whole scope rather than once per restored
 * record, a restored row holds a NULL position until its siblings have been
 * restored too: its own `afterUpdate` hook and its own reload both observe that
 * NULL. No other transaction can see it — the row is uncommitted — and
 * `SortableScopeRestoreBatch` refreshes the instances it restored once this
 * statement has run, so every `afterUpdateCommit` hook, which runs after
 * COMMIT, holds the final position. An instance the caller obtained by another
 * route is a different object the cascade never reaches, and anything needing a
 * restored record's position reloads it.
 *
 * The scope renumbered is the one the restored rows *physically* occupy, read
 * by primary key through `readSortableSnapshots` rather than taken from the
 * in-memory instance, since another writer may have moved a row between scopes
 * while it was soft deleted.
 *
 * @param dream - a record restored into this scope, which resolves the table,
 *   the primary key, the model's default scopes, and the scope's columns
 * @param txn - the transaction the restore runs in
 * @param positionField - the sortable field's position column
 * @param scope - the sortable field's scope
 * @param snapshot - the scope values the row physically carries
 */
export default async function restoreSortableScopePositions(
  dream: Dream,
  txn: DreamTransaction<any>,
  positionField: string,
  scope: string | string[] | undefined,
  snapshot: SortableSnapshot | undefined
): Promise<void> {
  const dreamClass = dream.constructor as typeof Dream
  const table = dream.table
  const primaryKey = dream['_primaryKey']

  // The STI scope is stripped, exactly as every other sortable path strips it:
  // an STI hierarchy shares one position space, so ranking one child's rows in
  // isolation would hand them positions its siblings already hold. Every other
  // default scope stays, which is what keeps a still-soft-deleted row — one the
  // cascade never reached — out of the ranking.
  const scopedSelect = filterQueryToScopeValues(
    dream,
    dreamClass.query().removeDefaultScope(STI_SCOPE_NAME).txn(txn).toKysely('select'),
    column => snapshotScopeValue(snapshot, column, () => (dream as any)[column]),
    scope
  )

  const ranked = scopedSelect
    .clearSelect()
    .select([
      sql.ref(primaryKey).as(RESTORE_PRIMARY_KEY),
      sql`row_number() over (order by ${sql.ref(positionField)} asc nulls last, ${sql.ref(primaryKey)} asc)`.as(
        RESTORE_POSITION
      ),
    ] as any)

  await dreamClass
    .query()
    .removeDefaultScope(STI_SCOPE_NAME)
    .txn(txn)
    .toKysely('update')
    .from(ranked.as(RESTORE_ALIAS))
    .set({ [positionField]: sql.ref(`${RESTORE_ALIAS}.${RESTORE_POSITION}`) })
    .whereRef(`${table}.${primaryKey}`, '=', `${RESTORE_ALIAS}.${RESTORE_PRIMARY_KEY}`)
    .where(
      sql.ref(`${table}.${positionField}`),
      'is distinct from',
      sql.ref(`${RESTORE_ALIAS}.${RESTORE_POSITION}`)
    )
    .execute()
}
