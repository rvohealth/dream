import Dream from '../dream';
export default function marshalDBArrayValue<T extends typeof Dream, DB extends InstanceType<T>['DB'], TableName extends keyof DB = InstanceType<T>['table'] & keyof DB, Table extends DB[keyof DB] = DB[TableName], Column extends keyof Table = keyof Table>(dreamClass: T, value: string | any[] | null | undefined): Table[Column] | null | undefined;
