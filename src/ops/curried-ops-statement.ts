import OpsStatement from './ops-statement'
import Dream from '../dream'
import { DB } from '../sync/schema'

export default class CurriedOpsStatement<
  T extends typeof Dream,
  FN extends keyof DB[InstanceType<T>['table']] & string
> {
  public factoryFn: (dreamClass: T, fieldName: FN) => OpsStatement

  constructor(factoryFn: (dreamClass: T, fieldName: FN) => OpsStatement) {
    this.factoryFn = factoryFn
  }

  public toOpsStatement(dreamClass: T, fieldName: FN) {
    return this.factoryFn(dreamClass, fieldName)
  }
}
