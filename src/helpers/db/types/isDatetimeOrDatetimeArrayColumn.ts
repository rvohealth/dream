import Dream from '../../../Dream.js'
import { DATETIME_OR_DATETIME_ARRAY_COLUMN_CHECK_REGEXP } from './helpers.js'

export default function isDatetimeOrDatetimeArrayColumn<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table): boolean {
  return DATETIME_OR_DATETIME_ARRAY_COLUMN_CHECK_REGEXP.test(dreamClass['cachedTypeFor'](column))
}
