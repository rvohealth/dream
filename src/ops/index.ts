import { ComparisonOperatorExpression } from 'kysely'
import OpsStatement from './ops-statement'

const ops = {
  in: (arr: any[]) => new OpsStatement('in', arr),
  like: (like: string) => new OpsStatement('like', like),
  ilike: (ilike: string) => new OpsStatement('ilike', ilike),
  expression: (operator: ComparisonOperatorExpression, value: any) => new OpsStatement(operator, value),
}

export default ops
