import InvalidColumnName from '../../exceptions/invalid-column-name'

export default function validateColumn(DBTypeCache: any, tableName: string, columnName: string) {
  if (!(DBTypeCache as Object).hasOwnProperty(tableName)) throw new InvalidColumnName(tableName, columnName)

  if (!(DBTypeCache[tableName] as Object).hasOwnProperty(columnName))
    throw new InvalidColumnName(tableName, columnName)

  return columnName
}
