import { Nullable } from 'kysely'
import Dream from '../Dream.js'
import Query from '../dream/Query.js'
import { IdType, TableColumnType } from './dream.js'
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
}>

export interface PreloadedDreamsAndWhatTheyPointTo {
  dream: Dream
  pointsToPrimaryKey: IdType
}

export interface FindEachOpts {
  batchSize?: number
}
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
}>

export type NamespacedColumnType<
  ColumnName,
  Q extends Query<any, any>,
  DreamInstance extends Dream,
  //
  // begin: inferred types
  JoinedAssociationsArr = Q['queryTypeOpts']['joinedAssociations'],
  AssociationName = ColumnName extends `${infer Name extends string}.${string}` ? Name : never,
  RealColumnName = ColumnName extends `${string}.${infer Col extends string}` ? Col : never,
  JoinedAssociation extends FindInterfaceWithValue<
    JoinedAssociationsArr,
    'alias',
    AssociationName
  > = FindInterfaceWithValue<JoinedAssociationsArr, 'alias', AssociationName>,
  JoinedTable = JoinedAssociation['table'] extends never
    ? DreamInstance['table']
    : JoinedAssociation['table'],
  ReturnType = TableColumnType<DreamInstance['schema'], JoinedTable, RealColumnName>,
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
        TableColumnType<DreamInstance['schema'], DreamInstance['table'], First>,
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
