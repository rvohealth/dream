import Dream from '../../../Dream'

export default function isDateColumn<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table): boolean {
  return dreamClass['cachedTypeFor'](column) === 'date'
}
