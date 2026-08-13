import Dream from '../../../../Dream.js'
import getColumnForSortableScope from './getColumnForSortableScope.js'
import scopeArray from './scopeArray.js'

/**
 * @internal
 *
 * The scope members of a sortable field paired with the database columns they
 * resolve to. A member names either the column itself or the BelongsTo
 * association whose foreign key backs it, and a caller matching incoming
 * attributes needs both spellings; a member that resolves to no column is
 * dropped.
 *
 * Every sortable path resolves its scope columns through this one function, so
 * that a lock key, a snapshot read, a group identity and a scope filter can
 * never disagree about which columns a sort scope is made of.
 */
export function sortableScopeColumnPairs(
  dream: Dream,
  scope: string | string[] | undefined
): [string, string][] {
  return scopeArray(scope).reduce<[string, string][]>((acc, singleScope) => {
    const column = getColumnForSortableScope(dream, singleScope)
    if (column) acc.push([singleScope, column])
    return acc
  }, [])
}

/**
 * @internal
 *
 * The database columns a sortable field's scope resolves to.
 */
export default function sortableScopeColumns(dream: Dream, scope: string | string[] | undefined): string[] {
  return sortableScopeColumnPairs(dream, scope).map(([, column]) => column)
}

/**
 * @internal
 *
 * The sort scope as `[column, value]` pairs — the shape a lock key is derived
 * from and a group is identified by. The value for each column comes from the
 * caller, which decides whether it is reading the in-memory instance or a
 * snapshot of the row.
 */
export function sortableScopeValues(
  dream: Dream,
  scope: string | string[] | undefined,
  valueForColumn: (column: string) => unknown
): [string, unknown][] {
  return sortableScopeColumns(dream, scope).map(column => [column, valueForColumn(column)])
}
