import InvalidColumnName from '../../exceptions/invalid-column-name'

export default function validateColumn(DBTypeCache: any, tableName: string, columnName: string) {
  if (!Object.prototype.hasOwnProperty.call(DBTypeCache, tableName))
    throw new InvalidColumnName(tableName, columnName)

  if (!Object.prototype.hasOwnProperty.call(DBTypeCache[tableName], columnName))
    throw new InvalidColumnName(tableName, columnName)

  return columnName
}
