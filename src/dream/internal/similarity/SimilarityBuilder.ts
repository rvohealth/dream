import { SelectQueryBuilder, UpdateQueryBuilder, sql } from 'kysely'
import ConnectedToDB from '../../../db/ConnectedToDB'
import { DbConnectionType } from '../../../db/types'
import validateColumn from '../../../db/validators/validateColumn'
import validateTable from '../../../db/validators/validateTable'
import validateTableAlias from '../../../db/validators/validateTableAlias'
import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import { isObject } from '../../../helpers/typechecks'
import OpsStatement from '../../../ops/ops-statement'
import DreamTransaction from '../../transaction'
import { RelaxedJoinsWhereStatement, SimilarityStatement, TRIGRAM_OPERATORS } from '../../types'
import similaritySelectSql from './similaritySelectSql'
import similarityWhereSql from './similarityWhereSql'

export default class SimilarityBuilder<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  Schema extends DreamInstance['schema'] = DreamInstance['schema'],
> extends ConnectedToDB<DreamInstance> {
  public readonly whereStatement: readonly WhereStatement<DB, Schema, any>[]
  public readonly whereNotStatement: readonly WhereStatement<DB, Schema, any>[]
  public readonly joinsWhereStatements: RelaxedJoinsWhereStatement<DB, Schema> = Object.freeze({})

  constructor(dreamInstance: DreamInstance, opts: SimilarityBuilderOpts<DreamInstance> = {}) {
    super(dreamInstance, opts)
    this.whereStatement = Object.freeze(opts.where || [])
    this.whereNotStatement = Object.freeze(opts.whereNot || [])
    this.joinsWhereStatements = Object.freeze(opts.joinsWhereStatements || {})
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
  public select<T extends SimilarityBuilder<DreamInstance>>(
    this: T,
    kyselyQuery: SelectQueryBuilder<DB, any, object>,
    { bypassOrder = false }: { bypassOrder?: boolean } = {}
  ): SelectQueryBuilder<DB, any, object> {
    this.whereStatementsWithSimilarityClauses().forEach((similarityStatement, index) => {
      kyselyQuery = this.addStatementToSelectQuery({
        kyselyQuery,
        similarityStatement,
        statementType: 'where',
        index,
        bypassOrder,
      })
    })

    this.whereJoinsStatementsWithSimilarityClauses().forEach((similarityStatement, index) => {
      kyselyQuery = this.addStatementToSelectQuery({
        kyselyQuery,
        similarityStatement,
        statementType: 'where_joins',
        index,
        bypassOrder,
      })
    })

    return kyselyQuery
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
  public update<T extends SimilarityBuilder<DreamInstance>>(
    this: T,
    kyselyQuery: UpdateQueryBuilder<DreamInstance['DB'], any, any, any>
  ): UpdateQueryBuilder<DreamInstance['DB'], any, any, any> {
    this.whereStatementsWithSimilarityClauses().forEach((similarityStatement, index) => {
      kyselyQuery = this.addStatementToUpdateQuery({
        kyselyQuery,
        similarityStatement,
        statementType: 'where',
        index,
      })
    })

    this.whereJoinsStatementsWithSimilarityClauses().forEach((similarityStatement, index) => {
      kyselyQuery = this.addStatementToUpdateQuery({
        kyselyQuery,
        similarityStatement,
        statementType: 'where_joins',
        index,
      })
    })

    return kyselyQuery
  }

  public get hasSimilarityClauses() {
    return !!this.statementsWithSimilarityClauses().length
  }

  public whereStatementsWithSimilarityClauses() {
    return this.similarityStatementFilter(this.whereStatement)
  }

  public whereNotStatementsWithSimilarityClauses() {
    return this.similarityStatementFilter(this.whereNotStatement)
  }

  public whereJoinsStatementsWithSimilarityClauses() {
    return this.recursiveWhereJoinsFinder(this.joinsWhereStatements, this.dreamClass)
  }

  private recursiveWhereJoinsFinder(obj: any, dreamClass: typeof Dream) {
    const similar: SimilarityStatement[] = []

    Object.keys(obj).forEach(associationName => {
      const tableValues = obj[associationName]

      const associationMetadata = dreamClass['associationMetadataMap']()[associationName]
      if (!associationMetadata) {
        return
      }

      let associationDreamClass: typeof Dream = associationMetadata.modelCB() as typeof Dream
      if (Array.isArray(associationDreamClass)) associationDreamClass = associationDreamClass[0]
      const tableName = associationDreamClass.table

      Object.keys(tableValues).forEach(columnOrAssociationName => {
        const statementOrValueOrNestedObject = tableValues[columnOrAssociationName]
        if (
          statementOrValueOrNestedObject?.isOpsStatement &&
          TRIGRAM_OPERATORS.includes(statementOrValueOrNestedObject?.operator)
        ) {
          similar.push({
            tableName,
            tableAlias: associationName,
            columnName: columnOrAssociationName,
            opsStatement: statementOrValueOrNestedObject,
          })
        } else if (
          isObject(statementOrValueOrNestedObject) &&
          !statementOrValueOrNestedObject?.isOpsStatement
        ) {
          // if it is an object, but not an array, it is likely a nested joins statement,
          // since joinsWhere objects can take a recursive shape, like:
          // {
          //   users: { compositions: { compositionAssets: { compositionAssetAudits: { notes: [OpsStatement] } } } }
          // }
          similar.push(...this.recursiveWhereJoinsFinder(tableValues, associationDreamClass))
        }
      })
    })

    return similar
  }

  public statementsWithSimilarityClauses() {
    return [
      ...this.whereStatementsWithSimilarityClauses(),
      ...this.whereNotStatementsWithSimilarityClauses(),
      ...this.whereJoinsStatementsWithSimilarityClauses(),
    ]
  }

  private addStatementToSelectQuery<T extends SimilarityBuilder<DreamInstance>>(
    this: T,
    {
      kyselyQuery,
      similarityStatement,
      index,
      statementType,
      bypassOrder,
    }: {
      kyselyQuery: SelectQueryBuilder<DB, any, object>
      similarityStatement: SimilarityStatement
      index: number
      statementType: SimilarityStatementType
      bypassOrder: boolean
    }
  ) {
    const schema = this.dreamClass.prototype.schema
    const primaryKeyName = this.dreamClass.primaryKey
    const { tableName, tableAlias, columnName } = similarityStatement

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { ref } = this.dbFor('select').dynamic

    const validatedTableAlias = validateTableAlias(tableAlias)
    const validatedPrimaryKey = validateColumn(schema, tableName, primaryKeyName)

    const nestedQuery = this.buildNestedSelectQuery({
      primaryKeyName,
      similarityStatement,
      statementIndex: index,
      statementType,
    })

    const trigramSearchAlias = this.similaritySearchId(tableAlias, columnName)
    kyselyQuery = kyselyQuery.innerJoin(nestedQuery.as(trigramSearchAlias), join =>
      join.onRef(
        `${validatedTableAlias}.${validatedPrimaryKey}` as any,
        '=',
        `${trigramSearchAlias}.trigram_search_id` as any
      )
    )

    if (!bypassOrder) {
      const rankSQLAlias = this.rankSQLAlias(statementType, index)
      kyselyQuery = kyselyQuery.orderBy(ref(`${trigramSearchAlias}.${rankSQLAlias}`), 'desc')
    }

    return kyselyQuery
  }

  private addStatementToUpdateQuery<T extends SimilarityBuilder<DreamInstance>>(
    this: T,
    {
      kyselyQuery,
      similarityStatement,
      statementType,
      index,
    }: {
      kyselyQuery: UpdateQueryBuilder<DreamInstance['DB'], any, any, any>
      similarityStatement: SimilarityStatement
      statementType: SimilarityStatementType
      index: number
    }
  ): UpdateQueryBuilder<DreamInstance['DB'], any, any, any> {
    const { tableName, tableAlias, columnName } = similarityStatement
    const schema = this.dreamClass.prototype.schema
    const primaryKeyName = this.dreamClass.primaryKey

    const validatedTableAlias = validateTableAlias(tableAlias)
    const validatedPrimaryKey = validateColumn(schema, tableName, primaryKeyName)

    const nestedQuery = this.buildNestedSelectQuery({
      primaryKeyName: validatedPrimaryKey,
      similarityStatement,
      statementIndex: index,
      statementType,
    })

    const trigramSearchAlias = this.similaritySearchId(tableAlias, columnName)
    const selectQuery = this.dbFor('select')
      .selectFrom(validatedTableAlias)
      .select(`${trigramSearchAlias}.trigram_search_id`)
      .innerJoin(nestedQuery.as(trigramSearchAlias), join =>
        join.onRef(
          `${validatedTableAlias}.${validatedPrimaryKey}` as any,
          '=',
          `${trigramSearchAlias}.trigram_search_id` as any
        )
      )

    kyselyQuery = kyselyQuery.where(primaryKeyName, 'in', selectQuery)
    return kyselyQuery
  }

  private buildNestedSelectQuery({
    primaryKeyName,
    statementType,
    statementIndex,
    similarityStatement,
  }: {
    primaryKeyName: string
    statementType: SimilarityStatementType
    statementIndex: number
    similarityStatement: SimilarityStatement
  }) {
    const schema = this.dreamClass.prototype.schema
    const { columnName, opsStatement, tableName } = similarityStatement
    const validatedTable = validateTable(schema, tableName)
    const validatedPrimaryKey = validateColumn(schema, tableName, primaryKeyName)

    let nestedQuery = this.dbFor('select')
      .selectFrom(tableName as any)
      .select(eb => {
        const tableNameRef = eb.ref<any>(validatedTable)
        const columnRef = eb.ref<any>(validatedPrimaryKey)
        return sql<string>`${tableNameRef}.${columnRef}`.as('trigram_search_id')
      })

    const rankSQLAlias = this.rankSQLAlias(statementType, statementIndex)
    nestedQuery = nestedQuery
      .select(eb =>
        similaritySelectSql<DreamInstance>({
          eb,
          tableName,
          columnName,
          opsStatement,
          schema,
          rankSQLAlias,
        })
      )
      .where(eb =>
        similarityWhereSql<DreamInstance>({
          eb,
          tableName,
          columnName,
          opsStatement,
          schema,
        })
      )

    return nestedQuery
  }

  private similarityStatementFilter(statements: readonly WhereStatement<DB, Schema, any>[]) {
    const similar: SimilarityStatement[] = []
    const tableName = this.dreamClass.table

    statements.forEach(statement => {
      Object.keys(statement).forEach(key => {
        if (
          (statement as any)[key]?.constructor?.name === 'OpsStatement' &&
          TRIGRAM_OPERATORS.includes(((statement as any)[key] as OpsStatement<any, any>).operator as any)
        ) {
          similar.push({
            tableName,
            tableAlias: tableName,
            columnName: key,
            opsStatement: (statement as any)[key],
          })
        }
      })
    })

    return similar
  }

  private similaritySearchId(tableName: string, columnName: string) {
    return `trigram_search_${tableName}_${columnName}`
  }

  private rankSQLAlias(statementType: SimilarityStatementType, statementIndex: number) {
    return `${statementType}_rank_${statementIndex + 1}`
  }
}

export interface SimilarityBuilderOpts<
  DreamInstance extends Dream,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  Schema extends DreamInstance['schema'] = DreamInstance['schema'],
> {
  where?: WhereStatement<DB, Schema, any>[]
  whereNot?: WhereStatement<DB, Schema, any>[]
  joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, Schema>
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType
}

export const SIMILARITY_TYPES = ['where', 'where_joins'] as const
export type SimilarityStatementType = (typeof SIMILARITY_TYPES)[number]
