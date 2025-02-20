import { ModifierExpression } from '../dream/types'

export default class ModifierStatement<ME extends ModifierExpression> {
  public operator: ModifierExpression
  public value: any
  constructor(operator: ME, value: any) {
    this.operator = operator
    this.value = value
  }
}
