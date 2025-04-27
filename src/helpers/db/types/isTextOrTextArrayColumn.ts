import Dream from '../../../Dream.js'

export default function isTextOrTextArrayColumn<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table): boolean {
  return /^(text|character varying|citext)/.test(dreamClass['cachedTypeFor'](column))
}
