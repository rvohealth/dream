import { AssociationTableNames } from '../../db/reflections'
import { DBTypeCache } from '../../sync/schema'

export default function cachedTypeForAttribute<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = AssociationTableNames<
    DB,
    SyncedAssociations
  > &
    keyof DB,
  Table extends DB[TableName] = DB[TableName]
>(attribute: keyof Table, { table }: { table: TableName }): string {
  return ((DBTypeCache as any)[table] as any)[attribute]
}
