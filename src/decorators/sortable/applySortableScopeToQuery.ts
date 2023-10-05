import Dream from '../../dream'
import Query from '../../dream/query'
import getForeignKeyForSortableScope from './getForeignKeyForSortableScope'

export default function applySortableScopeToQuery(query: Query<typeof Dream>, dream: Dream, scope?: string) {
  if (!scope) return query

  const foreignKey = getForeignKeyForSortableScope(dream, scope)!
  return query.where({
    [foreignKey]: (dream as any)[foreignKey],
  })
}
