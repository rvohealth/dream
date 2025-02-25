import { ModifierExpression } from '../dream/types'

export default class ModifierStatement<ME extends ModifierExpression, ValType> {
  public operator: ModifierExpression
  public value: ValType
  constructor(operator: ME, value: ValType) {
    this.operator = operator
    this.value = value
  }
}
