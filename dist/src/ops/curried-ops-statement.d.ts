import Dream from '../dream';
import OpsStatement from './ops-statement';
export default class CurriedOpsStatement<T extends typeof Dream, DB extends InstanceType<T>['DB'], FN extends keyof DB[InstanceType<T>['table']] & string> {
    factoryFn: (dreamClass: T, fieldName: FN) => OpsStatement<any, any>;
    constructor(factoryFn: (dreamClass: T, fieldName: FN) => OpsStatement<any, any>);
    toOpsStatement(dreamClass: T, fieldName: FN): OpsStatement<any, any>;
}
