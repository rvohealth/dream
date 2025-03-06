import Dream from '../Dream.js'
import OpsStatement from './ops-statement.js'

export default class CurriedOpsStatement<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  FN extends keyof DB[InstanceType<T>['table']] & string,
  FinalType,
> {
  public factoryFn: (dreamClass: T, fieldName: FN) => OpsStatement<any, FinalType>

  constructor(factoryFn: (dreamClass: T, fieldName: FN) => OpsStatement<any, FinalType>) {
    this.factoryFn = factoryFn
  }

  public toOpsStatement(dreamClass: T, fieldName: FN) {
    return this.factoryFn(dreamClass, fieldName)
  }
}
