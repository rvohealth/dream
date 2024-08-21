import { AssociationTableNames } from '../../db/reflections';
import Dream from '../../dream';
import { GlobalModelNames } from '../../dream/types';
import { HasManyOnlyOptions, HasOptions, HasStatement, HasThroughOptions } from './shared';
export default function HasOne<BaseInstance extends Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]>(globalAssociationNameOrNames: AssociationGlobalNameOrNames, opts?: HasOneOptions<BaseInstance, AssociationGlobalNameOrNames>): any;
export default function HasOne<BaseInstance extends Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]>(globalAssociationNameOrNames: AssociationGlobalNameOrNames, opts?: HasOneThroughOptions<BaseInstance, AssociationGlobalNameOrNames>): any;
export interface HasOneStatement<BaseInstance extends Dream, DB, Schema, ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB> extends HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasOne'> {
}
export interface HasOneOptions<BaseInstance extends Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]> extends Omit<HasOptions<BaseInstance, AssociationGlobalNameOrNames>, HasManyOnlyOptions> {
}
export interface HasOneThroughOptions<BaseInstance extends Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]> extends Omit<HasThroughOptions<BaseInstance, AssociationGlobalNameOrNames>, HasManyOnlyOptions> {
}
