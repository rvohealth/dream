import { WhereStatementForAssociation } from '../../../decorators/associations/shared';
import Dream from '../../../dream';
import Query from '../../query';
import DreamTransaction from '../../transaction';
import { DreamAssociationType } from '../../types';
export default function associationQuery<DreamInstance extends Dream, DB extends DreamInstance['DB'], TableName extends DreamInstance['table'], Schema extends DreamInstance['schema'], AssociationName extends keyof DreamInstance, Where extends WhereStatementForAssociation<DB, Schema, TableName, AssociationName>, AssociationQuery = Query<DreamAssociationType<DreamInstance, AssociationName>>>(dream: DreamInstance, txn: DreamTransaction<Dream, any> | null | undefined, associationName: AssociationName, { associationWhereStatement, bypassAllDefaultScopes, defaultScopesToBypass, }: {
    associationWhereStatement?: Where;
    bypassAllDefaultScopes: boolean;
    defaultScopesToBypass: string[];
}): AssociationQuery;
