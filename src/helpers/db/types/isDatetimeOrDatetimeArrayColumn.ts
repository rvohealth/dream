import Dream from '../../../Dream.js'

export default function isDatetimeOrDatetimeArrayColumn<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table): boolean {
  return /^timestamp/.test(dreamClass['cachedTypeFor'](column))
}
