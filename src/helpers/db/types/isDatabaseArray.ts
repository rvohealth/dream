import Dream from '../../../dream'

export default function isDatabaseArray<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName]
>(dreamClass: T, column: keyof Table): boolean {
  return /\[\]$/.test(dreamClass.cachedTypeFor(column))
}
