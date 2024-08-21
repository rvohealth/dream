import Dream from '../dream';
export declare function marshalDBValue<T extends typeof Dream, DB extends InstanceType<T>['DB'], TableName extends keyof DB = InstanceType<T>['table'] & keyof DB, Table extends DB[keyof DB] = DB[TableName]>(dreamClass: T, column: keyof Table, value: any): any;
