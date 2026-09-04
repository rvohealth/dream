import { CompiledQuery, Nullable } from 'kysely'
import Dream from '../Dream.js'
import Query from '../dream/Query.js'
import { ModelColumnType } from './dream.js'
import { FindInterfaceWithValue } from './utils.js'
import { JoinedAssociation, QueryTypeOptions } from './variadic.js'

export type QueryWithJoinedAssociationsType<
  Q extends Query<any, any>,
  JoinedAssociations extends Readonly<JoinedAssociation[]>,
> = Query<
  Q['dreamInstance'],
  ExtendQueryType<
    Q['queryTypeOpts'],
    Readonly<{
      joinedAssociations: JoinedAssociations
    }>
  >
>

export type QueryWithJoinedAssociationsTypeAndNoPreload<
  Q extends Query<any, any>,
  JoinedAssociations extends Readonly<JoinedAssociation[]> = Readonly<JoinedAssociation[]>,
> = Query<
  Q['dreamInstance'],
  ExtendQueryType<
    Q['queryTypeOpts'],
    Readonly<{
      joinedAssociations: JoinedAssociations
      allowPreload: false
    }>
  >
>

export type QueryWithJoinedAssociationsTypeAndNoLeftJoinPreload<
  Q extends Query<any, any>,
  JoinedAssociations extends Readonly<JoinedAssociation[]> = Readonly<JoinedAssociation[]>,
> = Query<
  Q['dreamInstance'],
  ExtendQueryType<
    Q['queryTypeOpts'],
    Readonly<{
      joinedAssociations: JoinedAssociations
      allowLeftJoinPreload: false
    }>
  >
>

export type DefaultQueryTypeOptions<
  TableNameSource extends Dream,
  TableAliasSource extends Dream | string = TableNameSource,
> = Readonly<{
  joinedAssociations: Readonly<[]>
  rootTableName: TableNameSource['table']
  rootTableAlias: TableAliasSource extends Dream ? TableAliasSource['table'] : TableAliasSource
  allowPreload: true
  allowLeftJoinPreload: true
  allowLimit: true
  allowOffset: true
  allowPaginate: true
  outputMode: undefined
  outputFormat: undefined
}>

export interface PreloadedDreamsAndWhatTheyPointTo {
  dream: Dream
  pointsToPrimaryKey: string | bigint | number
}

export interface FindEachOpts {
  /**
   * The number of records to load per batch. Defaults to 1000.
   */
  batchSize?: number
}

/**
 * What a Query's `output` method surfaces instead of executing the query:
 * the compiled sql statement ('sql'), or the database's query plan ('explain').
 */
export type QueryOutputMode = 'sql' | 'explain'

/**
 * The plan format an explain may be requested in. 'text' (the default)
 * yields the database's plain explain output, one line per entry; 'json'
 * yields the parsed JSON plan.
 */
export type DreamExplainFormat = 'text' | 'json'

export interface DreamExplainOptions<Format extends DreamExplainFormat = DreamExplainFormat> {
  /**
   * the format the database should render the plan in. Defaults to 'text',
   * the database's plain explain output.
   */
  format?: Format

  /**
   * when true, the database actually executes the query to gather real
   * timing and row counts, and the plan reflects the execution rather
   * than only the planner's estimates. The query's result rows are still
   * discarded by the database; only the plan is returned.
   */
  analyze?: boolean

  /**
   * when true, the database includes additional detail in the plan
   * (e.g., on Postgres, the output column list of each plan node).
   */
  verbose?: boolean
}

/**
 * What an explain resolves to: the plan lines for the 'text' format, or the
 * parsed JSON plan for the 'json' format.
 */
export type DreamExplainResult<Format extends DreamExplainFormat = DreamExplainFormat> = Format extends 'json'
  ? object[]
  : string[]

/**
 * The return type of a Query execution method, accounting for the Query's
 * output mode: the compiled sql statement in the 'sql' mode, the query plan
 * in the 'explain' mode, and the method's ordinary result otherwise.
 */
export type QueryResultForOutputMode<
  QueryTypeOpts extends Readonly<QueryTypeOptions>,
  DefaultResult,
> = QueryTypeOpts['outputMode'] extends 'sql'
  ? CompiledQuery<object>
  : QueryTypeOpts['outputMode'] extends 'explain'
    ? DreamExplainResult<
        QueryTypeOpts['outputFormat'] extends DreamExplainFormat ? QueryTypeOpts['outputFormat'] : 'text'
      >
    : DefaultResult

export type JoinTypes = 'inner' | 'left'

export type ExtendQueryType<
  OriginalOpts extends Readonly<QueryTypeOptions>,
  Opts extends Readonly<Partial<QueryTypeOptions>>,
> = Readonly<{
  joinedAssociations: Opts['joinedAssociations'] extends Readonly<JoinedAssociation[]>
    ? Readonly<[...OriginalOpts['joinedAssociations'], ...Opts['joinedAssociations']]>
    : OriginalOpts['joinedAssociations']

  rootTableName: OriginalOpts['rootTableName']
  rootTableAlias: OriginalOpts['rootTableAlias']

  allowPreload: Opts['allowPreload'] extends false ? false : OriginalOpts['allowPreload']
  allowLeftJoinPreload: Opts['allowLeftJoinPreload'] extends false
    ? false
    : OriginalOpts['allowLeftJoinPreload']
  allowLimit: Opts['allowLimit'] extends false ? false : OriginalOpts['allowLimit']
  allowOffset: Opts['allowOffset'] extends false ? false : OriginalOpts['allowOffset']
  allowPaginate: Opts['allowPaginate'] extends false ? false : OriginalOpts['allowPaginate']
  outputMode: Opts['outputMode'] extends QueryOutputMode ? Opts['outputMode'] : OriginalOpts['outputMode']
  outputFormat: Opts['outputFormat'] extends DreamExplainFormat
    ? Opts['outputFormat']
    : OriginalOpts['outputFormat']
}>

export type NamespacedColumnType<
  ColumnName,
  Q extends Query<any, any>,
  DreamInstance extends Dream,
  //
  // begin: inferred types
  JoinedAssociationsArr = Q['queryTypeOpts']['joinedAssociations'],
  AssociationName = ColumnName extends `${infer Name extends string}.${string}` ? Name : never,
  RealColumnName = ColumnName extends `${string}.${infer Col extends string}` ? Col : ColumnName,
  JoinedAssociation extends FindInterfaceWithValue<
    JoinedAssociationsArr,
    'alias',
    AssociationName
  > = FindInterfaceWithValue<JoinedAssociationsArr, 'alias', AssociationName>,
  JoinedTable = JoinedAssociation['table'] extends never
    ? DreamInstance['table']
    : JoinedAssociation['table'],
  ReturnType = ModelColumnType<DreamInstance['schema'], JoinedTable, RealColumnName>,
> = ReturnType
type NamespacedColumnTypes<ColumnNames, Q extends Query<any, any>, DreamInstance extends Dream> =
  ColumnNames extends Readonly<[infer First, ...infer Rest]>
    ? [
        NamespacedColumnType<First, Q, DreamInstance>,
        ...NamespacedColumnTypes<Readonly<Rest>, Q, DreamInstance>,
      ]
    : []

export type BaseModelColumnTypes<ColumnNames, DreamInstance extends Dream> =
  ColumnNames extends Readonly<[infer First, ...infer Rest]>
    ? [
        ModelColumnType<DreamInstance['schema'], DreamInstance['table'], First>,
        ...BaseModelColumnTypes<Readonly<Rest>, DreamInstance>,
      ]
    : []

export type NamespacedOrBaseModelColumnTypes<
  ColumnNames,
  Q extends Query<any, any>,
  DreamInstance extends Dream,
> = Q['queryTypeOpts']['joinedAssociations']['length'] extends 0
  ? BaseModelColumnTypes<ColumnNames, DreamInstance>
  : NamespacedColumnTypes<ColumnNames, Q, DreamInstance>

export type QueryToKyselyTableNamesType<
  Q extends Query<any, any>,
  DreamInstance extends Dream = Q['dreamInstance'],
  QueryTypeOpts extends Readonly<QueryTypeOptions> = Q['queryTypeOpts'],
  HasJoinedAssociations = QueryTypeOpts['joinedAssociations']['length'] extends 0 ? false : true,
  JoinedAssociationTables = HasJoinedAssociations extends true
    ? QueryTypeOpts['joinedAssociations'][number]['table']
    : null,
  JoinedAssociationAliases = HasJoinedAssociations extends true
    ? QueryTypeOpts['joinedAssociations'][number]['alias']
    : null,
  TableNames = HasJoinedAssociations extends true
    ? DreamInstance['table'] | JoinedAssociationTables | JoinedAssociationAliases
    : DreamInstance['table'],
> = TableNames

export type QueryToKyselyDBType<
  Q extends Query<any, any>,
  DreamInstance extends Dream = Q['dreamInstance'],
  AliasToDbMaps = QueryToKyselyAliasMap<Q>,
  DbType = AliasToDbMaps extends null ? DreamInstance['DB'] : DreamInstance['DB'] & AliasToDbMaps,
> = DbType

export type QueryToKyselyAliasMap<
  Q extends Query<any, any>,
  DreamInstance extends Dream = Q['dreamInstance'],
  QueryTypeOpts extends Readonly<QueryTypeOptions> = Q['queryTypeOpts'],
  HasJoinedAssociations = QueryTypeOpts['joinedAssociations']['length'] extends 0 ? false : true,
  AliasToDbMaps = HasJoinedAssociations extends true
    ? {
        [Key in QueryTypeOpts['joinedAssociations'][number]['alias']]: Nullable<
          DreamInstance['DB'][Extract<QueryTypeOpts['joinedAssociations'][number], { alias: Key }>['table']]
        >
      }
    : null,
> = AliasToDbMaps

export interface PaginatedDreamQueryOptions {
  /**
   * the number of records you would like to be returned in each page
   */
  pageSize?: number

  /**
   * the current page
   */
  page: number | null | undefined
}

export interface PaginatedDreamQueryResult<T extends Dream> {
  /**
   * the total number of records in the DB matching the query
   */
  recordCount: number

  /**
   * The number of pages that are needed to encapsulate these results
   */
  pageCount: number

  /**
   * The current page
   */
  currentPage: number

  /**
   * The results for the current page
   */
  results: T[]
}

export interface CursorPaginatedDreamQueryOptions {
  /**
   * the number of records you would like to be returned in each page
   */
  pageSize?: number

  /**
   * identifier of where to start the next page; undefined to start from the beginning; null when no more pages
   */
  cursor: string | null | undefined
}

export interface CursorPaginatedDreamQueryResult<T extends Dream> {
  /**
   * identifier of where to start the next page; undefined to start from the beginning; null when no more pages
   */
  cursor: string | null | undefined

  /**
   * The results for the current page
   */
  results: T[]
}

export type LoadForModifierFn = (
  associationName: string,
  dreamClass: typeof Dream
) => { and?: object; andAny?: object; andNot?: object } | 'omit' | undefined
