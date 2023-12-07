import InvalidTableName from '../../exceptions/invalid-table-name'

export default function validateTable(DBTypeCache: any, tableName: string) {
  if (!(DBTypeCache as Object).hasOwnProperty(tableName)) throw new InvalidTableName(DBTypeCache, tableName)
  return tableName
}
