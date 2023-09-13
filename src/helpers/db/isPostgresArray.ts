import { AssociationTableNames } from '../../db/reflections'
import cachedTypeForAttribute from './cachedTypeForAttribute'

export default function isPostgresArray<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = AssociationTableNames<
    DB,
    SyncedAssociations
  > &
    keyof DB,
  Table extends DB[TableName] = DB[TableName]
>(attribute: keyof Table, { table, dbTypeCache }: { table: TableName; dbTypeCache: any }): boolean {
  const cachedType = cachedTypeForAttribute<DB, SyncedAssociations, TableName, Table>(attribute, {
    table,
    dbTypeCache,
  })
  return !!cachedType?.split('|')?.find(type => /\[\]$/.test(type))
}
