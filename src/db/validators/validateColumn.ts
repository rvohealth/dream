import InvalidColumnName from '../../exceptions/InvalidColumnName'

export default function validateColumn<Schema, TableName extends keyof Schema & string>(
  schema: Schema,
  tableName: TableName,
  columnName: keyof Schema[TableName]['columns' & keyof Schema[TableName]] & string
) {
  if (!Object.prototype.hasOwnProperty.call(schema, tableName))
    throw new InvalidColumnName(tableName, columnName)

  if (!Object.prototype.hasOwnProperty.call((schema[tableName] as any)?.columns, columnName))
    throw new InvalidColumnName(tableName, columnName)

  return columnName
}
