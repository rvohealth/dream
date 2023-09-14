import Dream from '../dream'
import snakeify from '../../shared/helpers/snakeify'

export default function cachedFieldType<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  FN extends keyof DB[InstanceType<T>['table']] & string
>(dreamType: T, fieldName: FN) {
  const unaliasedFieldName = fieldName.split('.').pop() as string
  // @ts-ignore
  return kyselyTypesToSqlType(
    dreamType.prototype.dreamconf.dbTypeCache[dreamType.prototype.table][unaliasedFieldName]
  )
}

function kyselyTypesToSqlType(kyselyTypes: string) {
  return snakeify(kyselyTypes.split('|')[0])
}
