import Dream from '../../dream'

export default function cachedTypeForAttribute<
  T extends typeof Dream,
  DB extends InstanceType<T>['dreamconf']['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, attribute: keyof Table): string {
  return dreamClass.prototype.dreamconf.schema[dreamClass.table]?.['columns']?.[attribute]?.['dbType']
}
