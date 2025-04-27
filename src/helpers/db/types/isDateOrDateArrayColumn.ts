import Dream from '../../../Dream.js'

export default function isDateOrDateArrayColumn<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table): boolean {
  return /^date/.test(dreamClass['cachedTypeFor'](column))
}
