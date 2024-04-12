import { AssociationTableNames } from '../../db/reflections'

export default function dbTypeForAttribute<
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = AssociationTableNames<
    DB,
    SyncedAssociations
  > &
    keyof DB,
  Table extends DB[TableName] = DB[TableName],
>(attribute: keyof Table, { table, dbTypeCache }: { table: TableName; dbTypeCache: any }): string {
  return dbTypeCache[table][attribute]
}
