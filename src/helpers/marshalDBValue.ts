import { DateTime } from 'luxon'
import isDecimal from './db/isDecimal'
import isPostgresArray from './db/isPostgresArray'
import marshalPGArrayValue from './marshalPGArrayValue'
import { AssociationTableNames } from '../db/reflections'

export function marshalDBValue<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB = AssociationTableNames<
    DB,
    SyncedAssociations
  > &
    keyof DB,
  Table extends DB[TableName] = DB[TableName]
>(value: any, { table, column, dbTypeCache }: { table: TableName; column: keyof Table; dbTypeCache: any }) {
  if (
    value !== null &&
    value !== undefined &&
    isDecimal<DB, SyncedAssociations, TableName, Table>(column, { table, dbTypeCache })
  )
    return parseFloat(value)

  if (value?.constructor === Date) return DateTime.fromJSDate(value)

  if (isPostgresArray<DB, SyncedAssociations, TableName, Table>(column, { table, dbTypeCache }))
    return marshalPGArrayValue<DB, SyncedAssociations, TableName, Table>(value, column, { table })

  return value
}
