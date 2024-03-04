import { DbConnectionType } from '../../../db/types'
import { WhereStatement } from '../../../decorators/associations/shared'
import Dream from '../../../dream'
import DreamTransaction from '../../transaction'
import { RelaxedJoinsWhereStatement, SimilarityStatement, TRIGRAM_OPERATORS } from '../../types'
import _db from '../../../db'
import OpsStatement from '../../../ops/ops-statement'
import { SelectQueryBuilder, UpdateQueryBuilder, sql } from 'kysely'
import { ExtractTableAlias } from 'kysely/dist/cjs/parser/table-parser'
import validateColumn from '../../../db/validators/validateColumn'
import similarityWhereSql from './similarityWhereSql'
import similaritySelectSql from './similaritySelectSql'
import validateTable from '../../../db/validators/validateTable'
import ConnectedToDB from '../../../db/ConnectedToDB'
import validateTableAlias from '../../../db/validators/validateTableAlias'
import { isObject } from '../../../helpers/typechecks'

export default class SimilarityBuilder<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
> extends ConnectedToDB<DreamClass> {
  public readonly whereStatement: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze([])
  public readonly whereNotStatement: readonly WhereStatement<DB, SyncedAssociations, any>[] = Object.freeze(
    []
  )
  public readonly joinsWhereStatements: RelaxedJoinsWhereStatement<DB, SyncedAssociations> = Object.freeze({})
  constructor(DreamClass: DreamClass, opts: SimilarityBuilderOpts<DreamClass, DreamInstance> = {}) {
    super(DreamClass, opts)
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
            (to_tsquery('simple', ''' ' || $ 1 :: text || ' ''')),
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
  public select<T extends SimilarityBuilder<DreamClass>>(
    this: T,
    kyselyQuery: SelectQueryBuilder<DB, any, {}>,
    { bypassOrder = false }: { bypassOrder?: boolean } = {}
  ): SelectQueryBuilder<DB, any, {}> {
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
                (to_tsquery('simple', ''' ' || $ 2 :: text || ' ''')),
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
  public update<T extends SimilarityBuilder<DreamClass>>(
    this: T,
    kyselyQuery: UpdateQueryBuilder<
      InstanceType<DreamClass>['DB'],
      ExtractTableAlias<InstanceType<DreamClass>['DB'], InstanceType<DreamClass>['table']>,
      ExtractTableAlias<any, any>,
      any
    >
  ): UpdateQueryBuilder<
    InstanceType<DreamClass>['DB'],
    ExtractTableAlias<InstanceType<DreamClass>['DB'], InstanceType<DreamClass>['table']>,
    ExtractTableAlias<any, any>,
    any
  > {
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

      const associationMetadata = dreamClass.associationMap()[associationName]
      if (!associationMetadata) {
        return
      }

      let associationDreamClass: typeof Dream = associationMetadata.modelCB() as typeof Dream
      if (Array.isArray(associationDreamClass)) associationDreamClass = associationDreamClass[0]
      const tableName = associationDreamClass.prototype.table

      Object.keys(tableValues).forEach(columnOrAssociationName => {
        const statementOrValueOrNestedObject = (tableValues as any)[columnOrAssociationName]
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

  private addStatementToSelectQuery<T extends SimilarityBuilder<DreamClass>>(
    this: T,
    {
      kyselyQuery,
      similarityStatement,
      index,
      statementType,
      bypassOrder,
    }: {
      kyselyQuery: SelectQueryBuilder<DB, any, {}>
      similarityStatement: SimilarityStatement
      index: number
      statementType: SimilarityStatementType
      bypassOrder: boolean
    }
  ) {
    const dbTypeCache = this.dreamClass.prototype.dreamconf.dbTypeCache
    const primaryKeyName = this.dreamClass.prototype.primaryKey
    const { tableName, tableAlias, columnName } = similarityStatement
    const { ref } = this.dbFor('select').dynamic

    const validatedTableAlias = validateTableAlias(tableAlias)
    const validatedPrimaryKey = validateColumn(dbTypeCache, tableName, primaryKeyName)

    let nestedQuery = this.buildNestedSelectQuery({
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

  private addStatementToUpdateQuery<T extends SimilarityBuilder<DreamClass>>(
    this: T,
    {
      kyselyQuery,
      similarityStatement,
      statementType,
      index,
    }: {
      kyselyQuery: UpdateQueryBuilder<
        InstanceType<DreamClass>['DB'],
        ExtractTableAlias<InstanceType<DreamClass>['DB'], InstanceType<DreamClass>['table']>,
        ExtractTableAlias<any, any>,
        any
      >
      similarityStatement: SimilarityStatement
      statementType: SimilarityStatementType
      index: number
    }
  ): UpdateQueryBuilder<
    InstanceType<DreamClass>['DB'],
    ExtractTableAlias<InstanceType<DreamClass>['DB'], InstanceType<DreamClass>['table']>,
    ExtractTableAlias<any, any>,
    any
  > {
    const { tableName, tableAlias, columnName } = similarityStatement
    const dbTypeCache = this.dreamClass.prototype.dreamconf.dbTypeCache
    const primaryKeyName = this.dreamClass.prototype.primaryKey

    const validatedTableAlias = validateTableAlias(tableAlias)
    const validatedPrimaryKey = validateColumn(dbTypeCache, tableName, primaryKeyName)

    let nestedQuery = this.buildNestedSelectQuery({
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
    const dbTypeCache = this.dreamClass.prototype.dreamconf.dbTypeCache
    const { columnName, opsStatement, tableAlias, tableName } = similarityStatement
    const validatedTable = validateTable(dbTypeCache, tableName)
    const validatedPrimaryKey = validateColumn(dbTypeCache, tableName, primaryKeyName)

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
        similaritySelectSql<DreamClass>({
          eb,
          tableName,
          columnName,
          opsStatement,
          dbTypeCache,
          rankSQLAlias,
        })
      )
      .where(eb =>
        similarityWhereSql<DreamClass>({
          eb,
          tableName,
          columnName,
          opsStatement,
          dbTypeCache,
        })
      )

    return nestedQuery
  }

  private similarityStatementFilter(statements: readonly WhereStatement<DB, SyncedAssociations, any>[]) {
    const similar: SimilarityStatement[] = []
    const tableName = this.dreamClass.prototype.table

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
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB extends DreamInstance['DB'] = DreamInstance['DB'],
  SyncedAssociations extends DreamInstance['syncedAssociations'] = DreamInstance['syncedAssociations'],
> {
  where?: WhereStatement<DB, SyncedAssociations, any>[]
  whereNot?: WhereStatement<DB, SyncedAssociations, any>[]
  joinsWhereStatements?: RelaxedJoinsWhereStatement<DB, SyncedAssociations>
  transaction?: DreamTransaction<Dream> | null | undefined
  connection?: DbConnectionType
}

export const SIMILARITY_TYPES = ['where', 'where_joins'] as const
export type SimilarityStatementType = (typeof SIMILARITY_TYPES)[number]
