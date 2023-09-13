import { AssociationTableNames } from '../../db/reflections'
import cachedTypeForAttribute from './cachedTypeForAttribute'

export default function isDecimal<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = AssociationTableNames<
    DB,
    SyncedAssociations
  > &
    keyof DB,
  Table extends DB[TableName] = DB[TableName]
>(attribute: keyof Table, { table }: { table: TableName }): boolean {
  const cachedType = cachedTypeForAttribute<DB, SyncedAssociations, TableName, Table>(attribute, { table })
  return !!cachedType?.split('|')?.find(str => ['Numeric', 'Generated<Numeric>'].includes(str))
}
