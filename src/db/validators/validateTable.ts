import InvalidTableName from '../../errors/InvalidTableName.js.js'

export default function validateTable<Schema, TableName extends keyof Schema & string>(
  schema: Schema,
  tableName: TableName
) {
  if (!Object.prototype.hasOwnProperty.call(schema, tableName)) throw new InvalidTableName(schema, tableName)
  return tableName
}
