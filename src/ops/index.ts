import { ComparisonOperatorExpression, sql } from 'kysely'
import OpsStatement from './ops-statement'
import CurriedOpsStatement from './curried-ops-statement'
import Dream from '../dream'
import cachedFieldType from '../helpers/cachedFieldType'
import { DB } from '../sync/schema'

const ops = {
  in: (arr: any[]) => new OpsStatement('in', arr),
  notIn: (arr: any[]) => new OpsStatement('not in', arr),
  any: (value: any) =>
    new CurriedOpsStatement(function <
      T extends typeof Dream,
      FN extends keyof DB[InstanceType<T>['table']] & string
    >(dreamClass: T, fieldName: FN) {
      const castType: string = cachedFieldType(dreamClass, fieldName)
      return new OpsStatement('@>', sql`ARRAY[${sql.join([value])}]::${sql.raw(castType)}`)
    }),
  like: (like: string) => new OpsStatement('like', like),
  notLike: (notLike: string) => new OpsStatement('not like', notLike),
  ilike: (ilike: string) => new OpsStatement('ilike', ilike),
  equal: (equal: any) => new OpsStatement('=', equal),
  notEqual: (notEqual: any) => new OpsStatement('!=', notEqual),
  lessThan: (lessThan: number) => new OpsStatement('<', lessThan),
  lessThanOrEqualTo: (lessThanOrEqualTo: number) => new OpsStatement('<=', lessThanOrEqualTo),
  greaterThan: (greaterThan: number) => new OpsStatement('>', greaterThan),
  greaterThanOrEqualTo: (greaterThanOrEqualTo: number) => new OpsStatement('>=', greaterThanOrEqualTo),
  expression: (operator: ComparisonOperatorExpression, value: any) => new OpsStatement(operator, value),
}

export default ops
