import Dream from '../../../../Dream.js'
import Query from '../../../../dream/Query.js'
import sortableScopeColumns from './sortableScopeColumns.js'

/**
 * @internal
 *
 * Narrows a Dream `Query` to one sort scope, **reading the scope values off the
 * in-memory instance**. That is only the scope the row physically occupies when
 * the instance is known to agree with the row — inside a transaction that has
 * just written those values, or on a record read under the scope lock.
 *
 * Where the row may have been moved by another writer, the caller wants
 * `filterQueryToScopeValues` instead, which takes each column's value from the
 * caller (the snapshot read under the lock) rather than from the instance.
 */
export default function filterQueryToInstanceScope(
  query: Query<Dream>,
  dream: Dream,
  scope?: string | string[]
) {
  for (const column of sortableScopeColumns(dream, scope)) {
    const value = (dream as any)[column]
    query = query.where({ [column]: value ?? null })
  }

  return query
}
