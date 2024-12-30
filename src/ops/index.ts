import { sql } from 'kysely'
import Dream from '../Dream'
import { ComparisonOperatorExpression } from '../dream/types'
import AnyRequiresArrayColumn from '../errors/ops/AnyRequiresArrayColumn'
import isDatabaseArrayColumn from '../helpers/db/types/isDatabaseArrayColumn'
import CurriedOpsStatement from './curried-ops-statement'
import OpsStatement from './ops-statement'

const ops = {
  expression: (operator: ComparisonOperatorExpression, value: any) => new OpsStatement(operator, value),
  in: (arr: any[]) => new OpsStatement('in', arr),
  any: (value: any) =>
    new CurriedOpsStatement(function <
      T extends typeof Dream,
      DB extends InstanceType<T>['DB'],
      FN extends keyof DB[InstanceType<T>['table']] & string,
    >(dreamClass: T, fieldName: FN) {
      const column = fieldName.replace(/^.*\./, '')
      if (!isDatabaseArrayColumn(dreamClass, column)) throw new AnyRequiresArrayColumn(dreamClass, column)
      const castType = dreamClass['cachedTypeFor'](column)
      return new OpsStatement('@>', sql`ARRAY[${sql.join([value])}]::${sql.raw(castType)}`)
    }),
  like: (like: string) => new OpsStatement('like', like),
  ilike: (ilike: string) => new OpsStatement('ilike', ilike),
  match: (match: string, { caseInsensitive = false }: { caseInsensitive?: boolean } = {}) =>
    new OpsStatement(caseInsensitive ? '~*' : '~', match),
  equal: (equal: any) => new OpsStatement('=', equal),
  lessThan: (lessThan: number) => new OpsStatement('<', lessThan),
  lessThanOrEqualTo: (lessThanOrEqualTo: number) => new OpsStatement('<=', lessThanOrEqualTo),
  greaterThan: (greaterThan: number) => new OpsStatement('>', greaterThan),
  greaterThanOrEqualTo: (greaterThanOrEqualTo: number) => new OpsStatement('>=', greaterThanOrEqualTo),
  similarity: (similarity: string, { score = 0.3 }: { score?: number } = {}) =>
    new OpsStatement('%', similarity, { score }),
  wordSimilarity: (similarity: string, { score = 0.5 }: { score?: number } = {}) =>
    new OpsStatement('<%', similarity, { score }),
  strictWordSimilarity: (similarity: string, { score = 0.6 }: { score?: number } = {}) =>
    new OpsStatement('<<%', similarity, { score }),
  not: {
    in: (arr: any[]) => new OpsStatement('not in', arr, { negated: true }),
    like: (like: string) => new OpsStatement('not like', like, { negated: true }),
    ilike: (ilike: string) => new OpsStatement('not ilike', ilike, { negated: true }),
    match: (match: string, { caseInsensitive = false }: { caseInsensitive?: boolean } = {}) =>
      new OpsStatement(caseInsensitive ? '!~*' : '!~', match, { negated: true }),
    equal: (equal: any) => new OpsStatement('!=', equal, { negated: true }),
    lessThan: (lessThan: number) => new OpsStatement('!<', lessThan, { negated: true }),
  },
}

export default ops
