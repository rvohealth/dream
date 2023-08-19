import Dream from '../dream'
import { DB, DBTypeCache } from '../sync/schema'
import snakeify from '../../shared/helpers/snakeify'

export default function cachedFieldType<
  T extends typeof Dream,
  FN extends keyof DB[InstanceType<T>['table']] & string
>(dreamType: T, fieldName: FN) {
  const unaliasedFieldName = fieldName.split('.').pop() as string
  return kyselyTypesToSqlType(DBTypeCache[dreamType.prototype.table][unaliasedFieldName])
}

function kyselyTypesToSqlType(kyselyTypes: string) {
  return snakeify(kyselyTypes.split('|')[0])
}
