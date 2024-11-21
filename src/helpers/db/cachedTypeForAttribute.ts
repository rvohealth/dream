import Dream from '../../Dream2'

export default function cachedTypeForAttribute<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, attribute: keyof Table): string {
  return dreamClass.prototype.schema[dreamClass.table]?.['columns']?.[attribute]?.['dbType']
}
