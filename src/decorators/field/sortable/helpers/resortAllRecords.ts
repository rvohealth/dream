import { sql } from 'kysely'
import Dream from '../../../../Dream.js'
import DreamTransaction from '../../../../dream/DreamTransaction.js'
import Query from '../../../../dream/Query.js'
import SortableRequiresAdvisoryTransactionLocks from '../../../../errors/SortableRequiresAdvisoryTransactionLocks.js'
import { STI_SCOPE_NAME } from '../../../class/STI.js'
import acquireSortableScopeLocks from './acquireSortableScopeLocks.js'
import canonicalScopeValue from './canonicalScopeValue.js'
import filterQueryToScopeValues from './filterQueryToScopeValues.js'
import sortableScopeColumns from './sortableScopeColumns.js'
import sortableScopeLockKey from './sortableScopeLockKey.js'

/**
 * The alias and column names the renumbering UPDATE joins its `row_number()`
 * subquery on. They are namespaced so that no real column of the table being
 * resorted can collide with them.
 */
const RENUMBER_ALIAS = 'dream_resort_renumber'
const RENUMBER_PRIMARY_KEY = 'dream_resort_primary_key'
const RENUMBER_POSITION = 'dream_resort_position'

/**
 * The aliases the one-row summary of a sort scope's positions comes back under.
 * They are namespaced for the same reason the renumbering aliases are, and are
 * lowercase without underscores so that Kysely's CamelCasePlugin passes them
 * through untouched and each value can be read straight off the result row (the
 * same alias strategy `pluck` and the grouped aggregates use).
 */
const SUMMARY_ROW_COUNT = 'dreamresortrowcount'
const SUMMARY_DISTINCT_POSITIONS = 'dreamresortdistinctpositions'
const SUMMARY_MIN_POSITION = 'dreamresortminposition'
const SUMMARY_MAX_POSITION = 'dreamresortmaxposition'

/**
 * @internal
 *
 * Renumbers every sort scope of a model so that each one runs 1..n with no gaps.
 *
 * Four things make this safe to run against a live table:
 *
 * - **A driver that cannot take the scope lock fails before the table is
 *   read**, rather than succeeding for whichever scopes happen to be contiguous
 *   and throwing on the first one that is not.
 * - **The STI scope is stripped**, exactly as every sortable hook strips it. An
 *   STI hierarchy shares one position space, so renumbering one child's rows in
 *   isolation would hand them positions its siblings already hold.
 * - **Groups are identified structurally**, by the scope columns' `[column,
 *   value]` tuple rather than by joining the values into one string. Joining
 *   merges scopes whose values differ only in where a delimiter falls, and
 *   merges a null member with an empty-string one; a merged group is two
 *   physical sort scopes renumbered as though they were one, and no single lock
 *   key covers it.
 * - **Every discovered scope is renumbered under its own scope lock, from a
 *   read taken inside that lock.** The unlocked pass below only discovers
 *   *which* sort scopes exist; it decides nothing about their contents, because
 *   a concurrent create, destroy or raw update between the two reads is
 *   precisely the case this exists to repair. Whether a scope needs renumbering
 *   at all is decided under the lock.
 *
 * Each scope's transaction is this function's own: `resort` cannot join a
 * transaction the caller owns, and must not be called from inside one. It would
 * wait on a connection of its own for a scope lock the caller's transaction may
 * already hold — a wait no deadlock detector can see, which ends in
 * `SortableScopeLockWaitTimedOut` rather than in progress.
 */
export default async function resortAllRecords(
  dreamClass: typeof Dream,
  positionField: string,
  scope?: string | string[]
) {
  const queryDriverClass = Query.dbDriverClass(dreamClass.prototype.connectionName || 'default')

  if (!queryDriverClass.supportsAdvisoryTransactionLocks)
    throw new SortableRequiresAdvisoryTransactionLocks(queryDriverClass.name)

  // every scope value, lock key and group identity below is derived from class
  // level metadata — the table, the connection, the scope members' columns and
  // their database types — so one bare instance stands in for every row
  const derivationRecord = dreamClass.new()

  for (const scopeValues of await discoverSortScopes(dreamClass, derivationRecord, scope)) {
    await dreamClass.transaction(async txn => {
      await acquireSortableScopeLocks(derivationRecord, txn, [
        sortableScopeLockKey(derivationRecord, positionField, scopeValues),
      ])

      if (
        await scopeIsAlreadyOrdered({ dreamClass, derivationRecord, positionField, scope, scopeValues, txn })
      )
        return

      await renumberScope({ dreamClass, derivationRecord, positionField, scope, scopeValues, txn })
    })
  }
}

interface ScopeRenumberOpts {
  dreamClass: typeof Dream
  derivationRecord: Dream
  positionField: string
  scope: string | string[] | undefined
  scopeValues: [string, unknown][]
  txn: DreamTransaction<any>
}

/**
 * Every physical sort scope the table currently holds, as the `[column, value]`
 * tuples a lock key is derived from.
 *
 * One distinct read over the scope columns alone, which both bounds the cost —
 * a single round trip returning one row per sort scope, however many rows the
 * table holds — and makes the answer stable: a walk that windows the table can
 * be shifted past rows by a concurrent delete, and a sort scope whose only rows
 * fall in that gap would never be renumbered at all. Each discovered scope's
 * rows are read again under its own lock before anything is written.
 *
 * A sortable field with no scope has exactly one sort scope, the whole table,
 * so its answer needs no read.
 */
async function discoverSortScopes(
  dreamClass: typeof Dream,
  derivationRecord: Dream,
  scope: string | string[] | undefined
): Promise<[string, unknown][][]> {
  const columns = sortableScopeColumns(derivationRecord, scope)
  if (columns.length === 0) return [[]]

  const rows = (await stiUnscopedQuery(dreamClass)
    .toKysely('select')
    .clearSelect()
    .distinct()
    .select(columns as any)
    .execute()) as Record<string, unknown>[]

  // the database's `distinct` is by raw value; two raw values the column's type
  // treats as one (a citext scope column matching case-insensitively) are one
  // sort scope under one lock key, and canonicalization is what says so
  const sortScopes = new Map<string, [string, unknown][]>()

  for (const row of rows) {
    const scopeValues = columns.map((column): [string, unknown] => [column, row[column]])
    const identity = scopeIdentity(derivationRecord, scopeValues)
    if (!sortScopes.has(identity)) sortScopes.set(identity, scopeValues)
  }

  return [...sortScopes.values()]
}

/**
 * Whether the sort scope already runs 1..n, decided inside the scope's lock by
 * one aggregate row rather than by shipping every position in the scope to the
 * client: a sort scope can hold as many rows as the table does, and this runs
 * with the scope's lock held.
 *
 * A scope of `n` rows is already correct exactly when its positions are `n`
 * distinct non-null values running from 1 to n. `count(distinct position)`
 * drops both duplicates and nulls, so it agrees with `count(*)` only when every
 * row holds a position of its own, and `min`/`max` pin that set to 1..n. An
 * empty scope — one whose last row was destroyed between its discovery and this
 * lock — has nothing to renumber.
 */
async function scopeIsAlreadyOrdered({
  dreamClass,
  derivationRecord,
  positionField,
  scope,
  scopeValues,
  txn,
}: ScopeRenumberOpts): Promise<boolean> {
  const summary = (await scopedSelect({ dreamClass, derivationRecord, scope, scopeValues, txn })
    .clearSelect()
    .select([
      sql`count(*)`.as(SUMMARY_ROW_COUNT),
      sql`count(distinct ${sql.ref(positionField)})`.as(SUMMARY_DISTINCT_POSITIONS),
      sql`min(${sql.ref(positionField)})`.as(SUMMARY_MIN_POSITION),
      sql`max(${sql.ref(positionField)})`.as(SUMMARY_MAX_POSITION),
    ] as any)
    .executeTakeFirstOrThrow()) as Record<string, unknown>

  // counts come back from some drivers as strings, since a count is a bigint
  const rowCount = Number(summary[SUMMARY_ROW_COUNT])
  if (rowCount === 0) return true

  return (
    Number(summary[SUMMARY_DISTINCT_POSITIONS]) === rowCount &&
    Number(summary[SUMMARY_MIN_POSITION]) === 1 &&
    Number(summary[SUMMARY_MAX_POSITION]) === rowCount
  )
}

/**
 * Renumbers the whole sort scope in one statement, from a `row_number()` taken
 * over the scope's rows ordered by position, nulls first, ties broken by
 * primary key. A row already holding the position it is owed is left alone, so
 * a scope with a single gap in it writes a single row rather than all of them.
 */
async function renumberScope({
  dreamClass,
  derivationRecord,
  positionField,
  scope,
  scopeValues,
  txn,
}: ScopeRenumberOpts): Promise<void> {
  const table = derivationRecord.table
  const primaryKey = derivationRecord['_primaryKey']

  const renumbered = scopedSelect({ dreamClass, derivationRecord, scope, scopeValues, txn })
    .clearSelect()
    .select([
      sql.ref(primaryKey).as(RENUMBER_PRIMARY_KEY),
      sql`row_number() over (order by ${sql.ref(positionField)} asc nulls first, ${sql.ref(primaryKey)} asc)`.as(
        RENUMBER_POSITION
      ),
    ] as any)

  await stiUnscopedQuery(dreamClass)
    .txn(txn)
    .toKysely('update')
    .from(renumbered.as(RENUMBER_ALIAS))
    .set({ [positionField]: sql.ref(`${RENUMBER_ALIAS}.${RENUMBER_POSITION}`) })
    .whereRef(`${table}.${primaryKey}`, '=', `${RENUMBER_ALIAS}.${RENUMBER_PRIMARY_KEY}`)
    .where(
      sql.ref(`${table}.${positionField}`),
      'is distinct from',
      sql.ref(`${RENUMBER_ALIAS}.${RENUMBER_POSITION}`)
    )
    .execute()
}

/**
 * A kysely select over the rows of one physical sort scope, carrying the
 * model's default scopes (a soft-deleted row is not part of any sort scope) but
 * not the STI scope, and matching a null scope member with `is null`.
 */
function scopedSelect({
  dreamClass,
  derivationRecord,
  scope,
  scopeValues,
  txn,
}: Omit<ScopeRenumberOpts, 'positionField'>) {
  const values = new Map(scopeValues)

  return filterQueryToScopeValues(
    derivationRecord,
    stiUnscopedQuery(dreamClass).txn(txn).toKysely('select'),
    column => values.get(column) ?? null,
    scope
  )
}

function stiUnscopedQuery(dreamClass: typeof Dream): Query<Dream> {
  return dreamClass.query().removeDefaultScope(STI_SCOPE_NAME)
}

/**
 * A collision-free identity for a physical sort scope. Values are canonicalized
 * against the column's database type by the same function the advisory lock key
 * uses (null distinct from every string, a pending value agreeing with its
 * hydrated counterpart) and encoded structurally, so two distinct tuples can
 * never share an identity and a scope can never disagree with its own lock.
 */
function scopeIdentity(derivationRecord: Dream, scopeValues: [string, unknown][]): string {
  return JSON.stringify(
    scopeValues.map(([column, value]) => [column, canonicalScopeValue(derivationRecord, column, value)])
  )
}
