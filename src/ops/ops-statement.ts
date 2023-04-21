import { ComparisonOperatorExpression } from 'kysely'

export default class OpsStatement {
  public operator: ComparisonOperatorExpression
  public value: any
  constructor(operator: ComparisonOperatorExpression, value: any) {
    this.operator = operator
    this.value = value
  }
}
