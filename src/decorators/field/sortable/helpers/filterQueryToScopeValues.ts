import { SelectQueryBuilder, UpdateQueryBuilder } from 'kysely'
import Dream from '../../../../Dream.js'
import sortableScopeColumns from './sortableScopeColumns.js'

/**
 * @internal
 *
 * Narrows a kysely query to one sort scope, taking each scope column's value
 * **from the caller** rather than from the in-memory instance — the snapshot
 * read under the scope lock on the paths that compact a scope a record is
 * leaving, which is not necessarily the scope the instance was loaded from.
 *
 * This is also the one place the null branch lives: a null scope value has to
 * be matched with `is null`, since `column = NULL` is never true and the filter
 * would silently match nothing at all in a null-valued sort scope.
 *
 * The instance-reading sibling is `filterQueryToInstanceScope`.
 *
 * @param dream - the record whose class resolves the scope members to columns
 * @param kyselyQuery - the query to narrow
 * @param whereValueCB - the value to match each scope column against
 * @param scope - the sortable field's scope
 */
export default function filterQueryToScopeValues<
  QB extends UpdateQueryBuilder<any, any, any, any> | SelectQueryBuilder<any, any, any>,
>(dream: Dream, kyselyQuery: QB, whereValueCB: (column: string) => any, scope?: string | string[]): QB {
  for (const column of sortableScopeColumns(dream, scope)) {
    const columnValue = whereValueCB(column)

    if (columnValue === null) {
      kyselyQuery = (kyselyQuery as UpdateQueryBuilder<any, string, string, any>).where(
        column,
        'is',
        null
      ) as QB
    } else {
      kyselyQuery = (kyselyQuery as UpdateQueryBuilder<any, string, string, any>).where(
        column,
        '=',
        columnValue
      ) as QB
    }
  }

  return kyselyQuery
}
