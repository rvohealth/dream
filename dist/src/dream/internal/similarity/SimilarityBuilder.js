"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIMILARITY_TYPES = void 0;
const kysely_1 = require("kysely");
const ConnectedToDB_1 = __importDefault(require("../../../db/ConnectedToDB"));
const validateColumn_1 = __importDefault(require("../../../db/validators/validateColumn"));
const validateTable_1 = __importDefault(require("../../../db/validators/validateTable"));
const validateTableAlias_1 = __importDefault(require("../../../db/validators/validateTableAlias"));
const typechecks_1 = require("../../../helpers/typechecks");
const types_1 = require("../../types");
const similaritySelectSql_1 = __importDefault(require("./similaritySelectSql"));
const similarityWhereSql_1 = __importDefault(require("./similarityWhereSql"));
class SimilarityBuilder extends ConnectedToDB_1.default {
    constructor(dreamInstance, opts = {}) {
        super(dreamInstance, opts);
        this.joinsWhereStatements = Object.freeze({});
        this.whereStatement = Object.freeze(opts.where || []);
        this.whereNotStatement = Object.freeze(opts.whereNot || []);
        this.joinsWhereStatements = Object.freeze(opts.joinsWhereStatements || {});
    }
    /*
    #select
  
    uses ts_vector, ts_rank, and similarity/wordSimilarity/strictWordSimilarity to add to an existing select query
  
    produces the following sql:
    select
      "users".*
    from
      "users"
      inner join (
        select
          "users"."id" as "trigram_search_id",
          (
            ts_rank(
              (
                to_tsvector(
                  'simple',
                  coalesce("users"."name" :: text, '')
                )
              ),
              (websearch_to_tsquery('simple', ''' ' || $ 1 :: text || ' ''')),
              0
            )
          ) as "where_rank_1"
        from
          "users"
        where
          (
            similarity(
              $ 2 :: text,
              (coalesce("users"."name" :: text, ''))
            ) < $ 3
          )
      ) as "trigram_search_9f213a82d057f3547e51872ca4f04f29d141565c" on "users"."id" = "trigram_search_9f213a82d057f3547e51872ca4f04f29d141565c"."trigram_search_id"
    where
      "users"."deleted_at" is null
    order by
      "trigram_search_9f213a82d057f3547e51872ca4f04f29d141565c"."where_rank_1" desc
  
    [ world, world, 0.5 ]
    */
    select(kyselyQuery, { bypassOrder = false } = {}) {
        this.whereStatementsWithSimilarityClauses().forEach((similarityStatement, index) => {
            kyselyQuery = this.addStatementToSelectQuery({
                kyselyQuery,
                similarityStatement,
                statementType: 'where',
                index,
                bypassOrder,
            });
        });
        this.whereJoinsStatementsWithSimilarityClauses().forEach((similarityStatement, index) => {
            kyselyQuery = this.addStatementToSelectQuery({
                kyselyQuery,
                similarityStatement,
                statementType: 'where_joins',
                index,
                bypassOrder,
            });
        });
        return kyselyQuery;
    }
    /*
    #update
  
    uses ts_vector, ts_rank, and similarity/wordSimilarity/strictWordSimilarity to add to an existing update query
  
    update
      "compositions"
    set
      "content" = $ 1
    where
      "id" in (
        select
          "trigram_search_5a2aaab94c01acc649c87561240264e9a0ab7ecb"."trigram_search_id"
        from
          "compositions"
          inner join (
            select
              "compositions"."id" as "trigram_search_id",
              "id",
              (
                ts_rank(
                  (
                    to_tsvector(
                      'simple',
                      coalesce("compositions"."content" :: text, '')
                    )
                  ),
                  (websearch_to_tsquery('simple', ''' ' || $ 2 :: text || ' ''')),
                  0
                )
              ) as "where_rank_1"
            from
              "compositions"
            where
              (
                similarity(
                  $ 3 :: text,
                  (coalesce("compositions"."content" :: text, ''))
                ) >= $ 4
              )
          ) as "trigram_search_5a2aaab94c01acc649c87561240264e9a0ab7ecb" on "compositions"."id" = "trigram_search_5a2aaab94c01acc649c87561240264e9a0ab7ecb"."trigram_search_id"
      )
      and "compositions"."id" in (
        select
          "compositions"."id"
        from
          "users"
          inner join "compositions" on "users"."id" = "compositions"."user_id"
        where
          "users"."id" = $ 5
          and "users"."deleted_at" is null
      )
  
    [ cool, Opus, Opus, 0.3, 8818 ]
    */
    update(kyselyQuery) {
        this.whereStatementsWithSimilarityClauses().forEach((similarityStatement, index) => {
            kyselyQuery = this.addStatementToUpdateQuery({
                kyselyQuery,
                similarityStatement,
                statementType: 'where',
                index,
            });
        });
        this.whereJoinsStatementsWithSimilarityClauses().forEach((similarityStatement, index) => {
            kyselyQuery = this.addStatementToUpdateQuery({
                kyselyQuery,
                similarityStatement,
                statementType: 'where_joins',
                index,
            });
        });
        return kyselyQuery;
    }
    get hasSimilarityClauses() {
        return !!this.statementsWithSimilarityClauses().length;
    }
    whereStatementsWithSimilarityClauses() {
        return this.similarityStatementFilter(this.whereStatement);
    }
    whereNotStatementsWithSimilarityClauses() {
        return this.similarityStatementFilter(this.whereNotStatement);
    }
    whereJoinsStatementsWithSimilarityClauses() {
        return this.recursiveWhereJoinsFinder(this.joinsWhereStatements, this.dreamClass);
    }
    recursiveWhereJoinsFinder(obj, dreamClass) {
        const similar = [];
        Object.keys(obj).forEach(associationName => {
            const tableValues = obj[associationName];
            const associationMetadata = dreamClass['associationMetadataMap']()[associationName];
            if (!associationMetadata) {
                return;
            }
            let associationDreamClass = associationMetadata.modelCB();
            if (Array.isArray(associationDreamClass))
                associationDreamClass = associationDreamClass[0];
            const tableName = associationDreamClass.table;
            Object.keys(tableValues).forEach(columnOrAssociationName => {
                const statementOrValueOrNestedObject = tableValues[columnOrAssociationName];
                if (statementOrValueOrNestedObject?.isOpsStatement &&
                    types_1.TRIGRAM_OPERATORS.includes(statementOrValueOrNestedObject?.operator)) {
                    similar.push({
                        tableName,
                        tableAlias: associationName,
                        columnName: columnOrAssociationName,
                        opsStatement: statementOrValueOrNestedObject,
                    });
                }
                else if ((0, typechecks_1.isObject)(statementOrValueOrNestedObject) &&
                    !statementOrValueOrNestedObject?.isOpsStatement) {
                    // if it is an object, but not an array, it is likely a nested joins statement,
                    // since joinsWhere objects can take a recursive shape, like:
                    // {
                    //   users: { compositions: { compositionAssets: { compositionAssetAudits: { notes: [OpsStatement] } } } }
                    // }
                    similar.push(...this.recursiveWhereJoinsFinder(tableValues, associationDreamClass));
                }
            });
        });
        return similar;
    }
    statementsWithSimilarityClauses() {
        return [
            ...this.whereStatementsWithSimilarityClauses(),
            ...this.whereNotStatementsWithSimilarityClauses(),
            ...this.whereJoinsStatementsWithSimilarityClauses(),
        ];
    }
    addStatementToSelectQuery({ kyselyQuery, similarityStatement, index, statementType, bypassOrder, }) {
        const schema = this.dreamClass.prototype.schema;
        const primaryKeyName = this.dreamClass.primaryKey;
        const { tableName, tableAlias, columnName } = similarityStatement;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { ref } = this.dbFor('select').dynamic;
        const validatedTableAlias = (0, validateTableAlias_1.default)(tableAlias);
        const validatedPrimaryKey = (0, validateColumn_1.default)(schema, tableName, primaryKeyName);
        const nestedQuery = this.buildNestedSelectQuery({
            primaryKeyName,
            similarityStatement,
            statementIndex: index,
            statementType,
        });
        const trigramSearchAlias = this.similaritySearchId(tableAlias, columnName);
        kyselyQuery = kyselyQuery.innerJoin(nestedQuery.as(trigramSearchAlias), join => join.onRef(`${validatedTableAlias}.${validatedPrimaryKey}`, '=', `${trigramSearchAlias}.trigram_search_id`));
        if (!bypassOrder) {
            const rankSQLAlias = this.rankSQLAlias(statementType, index);
            kyselyQuery = kyselyQuery.orderBy(ref(`${trigramSearchAlias}.${rankSQLAlias}`), 'desc');
        }
        return kyselyQuery;
    }
    addStatementToUpdateQuery({ kyselyQuery, similarityStatement, statementType, index, }) {
        const { tableName, tableAlias, columnName } = similarityStatement;
        const schema = this.dreamClass.prototype.schema;
        const primaryKeyName = this.dreamClass.primaryKey;
        const validatedTableAlias = (0, validateTableAlias_1.default)(tableAlias);
        const validatedPrimaryKey = (0, validateColumn_1.default)(schema, tableName, primaryKeyName);
        const nestedQuery = this.buildNestedSelectQuery({
            primaryKeyName: validatedPrimaryKey,
            similarityStatement,
            statementIndex: index,
            statementType,
        });
        const trigramSearchAlias = this.similaritySearchId(tableAlias, columnName);
        const selectQuery = this.dbFor('select')
            .selectFrom(validatedTableAlias)
            .select(`${trigramSearchAlias}.trigram_search_id`)
            .innerJoin(nestedQuery.as(trigramSearchAlias), join => join.onRef(`${validatedTableAlias}.${validatedPrimaryKey}`, '=', `${trigramSearchAlias}.trigram_search_id`));
        kyselyQuery = kyselyQuery.where(primaryKeyName, 'in', selectQuery);
        return kyselyQuery;
    }
    buildNestedSelectQuery({ primaryKeyName, statementType, statementIndex, similarityStatement, }) {
        const schema = this.dreamClass.prototype.schema;
        const { columnName, opsStatement, tableName } = similarityStatement;
        const validatedTable = (0, validateTable_1.default)(schema, tableName);
        const validatedPrimaryKey = (0, validateColumn_1.default)(schema, tableName, primaryKeyName);
        let nestedQuery = this.dbFor('select')
            .selectFrom(tableName)
            .select(eb => {
            const tableNameRef = eb.ref(validatedTable);
            const columnRef = eb.ref(validatedPrimaryKey);
            return (0, kysely_1.sql) `${tableNameRef}.${columnRef}`.as('trigram_search_id');
        });
        const rankSQLAlias = this.rankSQLAlias(statementType, statementIndex);
        nestedQuery = nestedQuery
            .select(eb => (0, similaritySelectSql_1.default)({
            eb,
            tableName,
            columnName,
            opsStatement,
            schema,
            rankSQLAlias,
        }))
            .where(eb => (0, similarityWhereSql_1.default)({
            eb,
            tableName,
            columnName,
            opsStatement,
            schema,
        }));
        return nestedQuery;
    }
    similarityStatementFilter(statements) {
        const similar = [];
        const tableName = this.dreamClass.table;
        statements.forEach(statement => {
            Object.keys(statement).forEach(key => {
                if (statement[key]?.constructor?.name === 'OpsStatement' &&
                    types_1.TRIGRAM_OPERATORS.includes(statement[key].operator)) {
                    similar.push({
                        tableName,
                        tableAlias: tableName,
                        columnName: key,
                        opsStatement: statement[key],
                    });
                }
            });
        });
        return similar;
    }
    similaritySearchId(tableName, columnName) {
        return `trigram_search_${tableName}_${columnName}`;
    }
    rankSQLAlias(statementType, statementIndex) {
        return `${statementType}_rank_${statementIndex + 1}`;
    }
}
exports.default = SimilarityBuilder;
exports.SIMILARITY_TYPES = ['where', 'where_joins'];
