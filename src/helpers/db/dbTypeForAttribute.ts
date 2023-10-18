import { AssociationTableNames } from '../../db/reflections'

export default function dbTypeForAttribute<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = AssociationTableNames<
    DB,
    SyncedAssociations
  > &
    keyof DB,
  Table extends DB[TableName] = DB[TableName]
>(attribute: keyof Table, { table, dbTypeCache }: { table: TableName; dbTypeCache: any }): string {
  return (dbTypeCache[table] as any)[attribute]
}
