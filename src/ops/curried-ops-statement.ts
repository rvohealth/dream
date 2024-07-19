import Dream from '../dream'
import OpsStatement from './ops-statement'

export default class CurriedOpsStatement<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  FN extends keyof DB[InstanceType<T>['table']] & string,
> {
  public factoryFn: (dreamClass: T, fieldName: FN) => OpsStatement<any, any>

  constructor(factoryFn: (dreamClass: T, fieldName: FN) => OpsStatement<any, any>) {
    this.factoryFn = factoryFn
  }

  public toOpsStatement(dreamClass: T, fieldName: FN) {
    return this.factoryFn(dreamClass, fieldName)
  }
}
