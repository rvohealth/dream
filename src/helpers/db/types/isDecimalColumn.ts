import Dream from '../../../dream'

export default function isDecimalColumn<
  T extends typeof Dream,
  DB extends InstanceType<T>['dreamconf']['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table): boolean {
  return dreamClass['cachedTypeFor'](column) === 'numeric'
}
