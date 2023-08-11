import { AssociationTableNames } from '../../db/reflections'
import { DB } from '../../sync/schema'
import cachedTypeForAttribute from './cachedTypeForAttribute'

export default function isPostgresArray<
  TableName extends AssociationTableNames,
  Table extends DB[keyof DB] = DB[TableName]
>(attribute: keyof Table, { table }: { table: TableName }): boolean {
  const cachedType = cachedTypeForAttribute(attribute, { table })
  return !!cachedType?.split('|')?.find(type => /\[\]$/.test(type))
}
