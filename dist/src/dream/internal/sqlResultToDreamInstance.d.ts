import { AssociationTableNames } from '../../db/reflections';
import Dream from '../../dream';
export default function sqlResultToDreamInstance<DreamClass extends typeof Dream, DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>, Schema extends DreamInstance['schema'] = DreamInstance['schema'], DB extends DreamInstance['DB'] = DreamInstance['DB'], TableName extends AssociationTableNames<DB, Schema> & keyof DB = InstanceType<DreamClass>['table'], Table extends DB[TableName] = DB[TableName]>(dreamClass: DreamClass, sqlResult: any): InstanceType<DreamClass> | Dream;
export declare function findExtendingDreamClass(dreamClass: typeof Dream, type: string): typeof Dream | undefined;
