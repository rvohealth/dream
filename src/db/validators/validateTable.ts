import InvalidTableName from '../../exceptions/invalid-table-name'

export default function validateTable(DBTypeCache: any, tableName: string) {
  if (!Object.prototype.hasOwnProperty.call(DBTypeCache, tableName))
    throw new InvalidTableName(DBTypeCache, tableName)
  return tableName
}
