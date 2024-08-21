import { WhereStatement } from '../../../decorators/associations/shared';
import Dream from '../../../dream';
import DreamTransaction from '../../transaction';
export default function destroyAssociation<DreamInstance extends Dream, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], AssociationName extends keyof DreamInstance, Where extends WhereStatement<DB, Schema, TableName>>(dream: DreamInstance, txn: DreamTransaction<Dream, any> | null | undefined, associationName: AssociationName, { associationWhereStatement, bypassAllDefaultScopes, defaultScopesToBypass, cascade, reallyDestroy, skipHooks, }: {
    associationWhereStatement?: Where;
    bypassAllDefaultScopes: boolean;
    defaultScopesToBypass: string[];
    cascade: boolean;
    reallyDestroy: boolean;
    skipHooks: boolean;
}): Promise<number>;
