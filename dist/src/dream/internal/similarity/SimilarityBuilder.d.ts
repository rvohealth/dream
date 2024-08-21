import { SelectQueryBuilder, UpdateQueryBuilder } from 'kysely';
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser';
import ConnectedToDB from '../../../db/ConnectedToDB';
import { DbConnectionType } from '../../../db/types';
import { WhereStatement } from '../../../decorators/associations/shared';
import Dream from '../../../dream';
import DreamTransaction from '../../transaction';
import { RelaxedJoinsWhereStatement, SimilarityStatement } from '../../types';
export default class SimilarityBuilder<DreamInstance extends Dream, DB extends DreamInstance['DB'] = DreamInstance['DB'], Schema extends DreamInstance['schema'] = DreamInstance['schema']> extends ConnectedToDB<DreamInstance> {
    readonly whereStatement: readonly WhereStatement<DB, Schema, any>[];
    readonly whereNotStatement: readonly WhereStatement<DB, Schema, any>[];
    readonly joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema>;
    constructor(dreamInstance: DreamInstance, opts?: SimilarityBuilderOpts<DreamInstance>);
    select<T extends SimilarityBuilder<DreamInstance>>(this: T, kyselyQuery: SelectQueryBuilder<DB, any, object>, { bypassOrder }?: {
        bypassOrder?: boolean;
    }): SelectQueryBuilder<DB, any, object>;
    update<T extends SimilarityBuilder<DreamInstance>>(this: T, kyselyQuery: UpdateQueryBuilder<DreamInstance['DB'], ExtractTableAlias<DreamInstance['DB'], DreamInstance['table']>, ExtractTableAlias<any, any>, any>): UpdateQueryBuilder<DreamInstance['DB'], ExtractTableAlias<DreamInstance['DB'], DreamInstance['table']>, ExtractTableAlias<any, any>, any>;
    get hasSimilarityClauses(): boolean;
    whereStatementsWithSimilarityClauses(): SimilarityStatement[];
    whereNotStatementsWithSimilarityClauses(): SimilarityStatement[];
    whereJoinsStatementsWithSimilarityClauses(): SimilarityStatement[];
    private recursiveWhereJoinsFinder;
    statementsWithSimilarityClauses(): SimilarityStatement[];
    private addStatementToSelectQuery;
    private addStatementToUpdateQuery;
    private buildNestedSelectQuery;
    private similarityStatementFilter;
    private similaritySearchId;
    private rankSQLAlias;
}
export interface SimilarityBuilderOpts<DreamInstance extends Dream, DB extends DreamInstance['DB'] = DreamInstance['DB'], Schema extends DreamInstance['schema'] = DreamInstance['schema']> {
    where?: WhereStatement<DB, Schema, any>[];
    whereNot?: WhereStatement<DB, Schema, any>[];
    joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, Schema>;
    transaction?: DreamTransaction<Dream> | null | undefined;
    connection?: DbConnectionType;
}
export declare const SIMILARITY_TYPES: readonly ["where", "where_joins"];
export type SimilarityStatementType = (typeof SIMILARITY_TYPES)[number];
