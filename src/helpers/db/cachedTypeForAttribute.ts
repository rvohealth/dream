import { AssociationTableNames } from '../../db/reflections'
import { DB, DBTypeCache } from '../../sync/schema'

export default function cachedTypeForAttribute<
  TableName extends AssociationTableNames,
  Table extends DB[keyof DB] = DB[TableName]
>(attribute: keyof Table, { table }: { table: TableName }): string {
  return ((DBTypeCache as any)[table] as any)[attribute]
}
