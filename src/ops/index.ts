import { ComparisonOperatorExpression as KyselyComparisonOperatorExpression, sql } from 'kysely'
import Dream from '../Dream'
import { TrigramOperator } from '../dream/types'
import AnyRequiresArrayColumn from '../errors/ops/AnyRequiresArrayColumn'
import isDatabaseArrayColumn from '../helpers/db/types/isDatabaseArrayColumn'
import CurriedOpsStatement from './curried-ops-statement'
import OpsStatement from './ops-statement'

type ArrayOperatorType = 'in' | 'not in'

const ops = {
  expression: <
    const T,
    const Operator extends KyselyComparisonOperatorExpression | TrigramOperator,
    const ComputedT extends Operator extends ArrayOperatorType ? (T & Readonly<unknown[]>)[number] : T,
  >(
    operator: Operator,
    value: T
  ): OpsStatement<Operator, ComputedT, any> => new OpsStatement(operator, value as unknown as ComputedT),
  in: <const T extends unknown[]>(arr: T) => new OpsStatement<'in', T[number]>('in', arr as T[number]),
  any: <const AnyT>(value: AnyT): CurriedOpsStatement<any, any, any, AnyT> =>
    new CurriedOpsStatement(function <
      T extends typeof Dream,
      DB extends InstanceType<T>['DB'],
      FN extends keyof DB[InstanceType<T>['table']] & string,
      AnyT,
    >(dreamClass: T, fieldName: FN): OpsStatement<any, AnyT, any> {
      const column = fieldName.replace(/^.*\./, '')
      if (!isDatabaseArrayColumn(dreamClass, column)) throw new AnyRequiresArrayColumn(dreamClass, column)
      const castType = dreamClass['cachedTypeFor'](column)
      return new OpsStatement('@>', sql`ARRAY[${sql.join([value])}]::${sql.raw(castType)}`) as OpsStatement<
        '@>',
        AnyT
      >
    }) as CurriedOpsStatement<any, any, any, AnyT>,
  like: (like: string) => new OpsStatement('like', like),
  ilike: (ilike: string) => new OpsStatement('ilike', ilike),
  match: (match: string, { caseInsensitive = false }: { caseInsensitive?: boolean } = {}) =>
    new OpsStatement(caseInsensitive ? '~*' : '~', match),
  // current
  equal: <const T>(equal: T) => new OpsStatement('=', equal),
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
    in: <const T extends unknown[]>(arr: T) => new OpsStatement<'not in', T[number]>('not in', arr),
    like: (like: string) => new OpsStatement('not like', like),
    ilike: (ilike: string) => new OpsStatement('not ilike', ilike),
    match: (match: string, { caseInsensitive = false }: { caseInsensitive?: boolean } = {}) =>
      new OpsStatement(caseInsensitive ? '!~*' : '!~', match),
    equal: <const T>(equal: T) => new OpsStatement('!=', equal),
    lessThan: (lessThan: number) => new OpsStatement('>=', lessThan),
    lessThanOrEqualTo: (lessThanOrEqualTo: number) => new OpsStatement('>', lessThanOrEqualTo),
    greaterThan: (greaterThan: number) => new OpsStatement('<=', greaterThan),
    greaterThanOrEqualTo: (greaterThanOrEqualTo: number) => new OpsStatement('<', greaterThanOrEqualTo),
  },
}

export default ops
