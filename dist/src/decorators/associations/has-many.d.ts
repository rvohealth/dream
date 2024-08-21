import { AssociationTableNames } from '../../db/reflections';
import Dream from '../../dream';
import { GlobalModelNames } from '../../dream/types';
import { HasOptions, HasStatement, HasThroughOptions } from './shared';
export default function HasMany<BaseInstance extends Dream = Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[] = GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]>(globalAssociationNameOrNames: AssociationGlobalNameOrNames, opts?: HasManyOptions<BaseInstance, AssociationGlobalNameOrNames>): any;
export default function HasMany<BaseInstance extends Dream = Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[] = GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]>(globalAssociationNameOrNames: AssociationGlobalNameOrNames, opts?: HasManyThroughOptions<BaseInstance, AssociationGlobalNameOrNames>): any;
export interface HasManyStatement<BaseInstance extends Dream, DB, Schema, ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB> extends HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasMany'> {
}
export interface HasManyOptions<BaseInstance extends Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]> extends HasOptions<BaseInstance, AssociationGlobalNameOrNames> {
}
export interface HasManyThroughOptions<BaseInstance extends Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]> extends HasThroughOptions<BaseInstance, AssociationGlobalNameOrNames> {
}
