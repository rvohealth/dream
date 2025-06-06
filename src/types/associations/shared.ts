import {
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  SelectQueryBuilder,
  Updateable,
} from 'kysely'
import Dream from '../../Dream.js'
import { DreamConst } from '../../dream/constants.js'
import CalendarDate from '../../helpers/CalendarDate.js'
import { DateTime } from '../../helpers/DateTime.js'
import { Range } from '../../helpers/range.js'
import CurriedOpsStatement from '../../ops/curried-ops-statement.js'
import OpsStatement, { ExtraSimilarityArgs } from '../../ops/ops-statement.js'
import { AssociationTableNames } from '../db.js'
import {
  DefaultScopeName,
  DefaultScopeNameForTable,
  DreamBelongsToAssociationMetadata,
  DreamColumnNames,
  IdType,
  OrderDir,
  TableColumnEnumTypeArray,
  TableColumnNames,
  TableColumnType,
  TrigramOperator,
} from '../dream.js'
import { Inc, MergeUnionOfRecordTypes, ReadonlyTail, UnionToIntersection } from '../utils.js'
import { JoinedAssociation } from '../variadic.js'
import { BelongsToStatement } from './belongsTo.js'
import { HasManyStatement } from './hasMany.js'
import { HasOneStatement } from './hasOne.js'

export type MAX_JOINED_TABLES_DEPTH = 25

export type AssociationMetadataMap = Record<string, AssociationStatement>

export type AssociatedBelongsToModelType<
  I extends Dream,
  AssociationName extends keyof DreamBelongsToAssociationMetadata<I>,
  PossibleArrayAssociationType extends I[AssociationName & keyof I] = I[AssociationName & keyof I],
  AssociationType extends PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType,
> = AssociationType

// For sending a BelongsTo model into a statement such as `await Post.create({ user })`

export type AssociatedModelParam<
  I extends Dream,
  AssociationExists = keyof DreamBelongsToAssociationMetadata<I> extends never ? false : true,
  AssociationName = AssociationExists extends false
    ? never
    : keyof DreamBelongsToAssociationMetadata<I> & string,
  RetObj = AssociationExists extends false
    ? never
    : AssociationName extends never
      ? never
      : {
          [K in AssociationName &
            keyof DreamBelongsToAssociationMetadata<I> &
            string]: AssociatedBelongsToModelType<I, K> | null
        },
> = Partial<UnionToIntersection<RetObj>>

export type PassthroughOnClause<PassthroughColumns extends string[]> = Partial<
  Record<PassthroughColumns[number], any>
>
type DreamSelectable<DB, Schema, TableName extends AssociationTableNames<DB, Schema> & keyof DB> = Partial<{
  [ColumnName in keyof DB[TableName]]: NonKyselySupportedSupplementalWhereClauseValues<
    DB,
    Schema,
    TableName,
    ColumnName
  >
}>
type NonKyselySupportedSupplementalWhereClauseValues<
  DB,
  Schema,
  TableName,
  Column,
  ColumnType = TableColumnType<Schema, TableName, Column>,
  EnumTypeArray extends string[] | null = TableColumnEnumTypeArray<Schema, TableName, Column>,
  PermanentOpsValTypes = null | readonly [],
  OpsValType = EnumTypeArray extends string[]
    ? EnumTypeArray[number] | PermanentOpsValTypes
    : ColumnType | PermanentOpsValTypes,
  PartialTypes = EnumTypeArray extends null
    ? ColumnType extends DateTime
      ?
          | DateTime[]
          | Range<DateTime>
          | (() => Range<DateTime>)
          | Range<CalendarDate>
          | (() => Range<CalendarDate>)
          | OpsStatement<KyselyComparisonOperatorExpression, OpsValType, any>
      : ColumnType extends CalendarDate
        ?
            | CalendarDate[]
            | Range<CalendarDate>
            | (() => Range<CalendarDate>)
            | Range<DateTime>
            | (() => Range<DateTime>)
            | OpsStatement<KyselyComparisonOperatorExpression, OpsValType>
        : ColumnType extends number
          ?
              | (number | bigint)[]
              | Range<number>
              | OpsStatement<KyselyComparisonOperatorExpression, OpsValType, any>
          : ColumnType extends string
            ?
                | string[]
                | OpsStatement<KyselyComparisonOperatorExpression, string, any>
                | OpsStatement<TrigramOperator, OpsValType, ExtraSimilarityArgs>
            : ColumnType extends IdType
              ? IdType[] | OpsStatement<KyselyComparisonOperatorExpression, OpsValType, any>
              : never
    : EnumTypeArray extends string[]
      ? EnumTypeArray | OpsStatement<KyselyComparisonOperatorExpression, OpsValType, any>
      : never,
> = PartialTypes extends never
  ?
      | OpsStatement<KyselyComparisonOperatorExpression, OpsValType, any>
      | CurriedOpsStatement<any, any, any, OpsValType>
      | SelectQueryBuilder<DB, keyof DB, any>
  : PartialTypes | CurriedOpsStatement<any, any, any, OpsValType> | SelectQueryBuilder<DB, keyof DB, any>

export type WhereStatementForDreamClass<DreamClass extends typeof Dream> = WhereStatement<
  InstanceType<DreamClass>['DB'],
  InstanceType<DreamClass>['schema'],
  InstanceType<DreamClass>['table']
>

export type WhereStatementForDream<DreamInstance extends Dream> = WhereStatement<
  DreamInstance['DB'],
  DreamInstance['schema'],
  DreamInstance['table']
>
type AssociationNameToDotReferencedColumns<
  DB,
  TableName extends keyof DB,
  AssociationName,
> = `${AssociationName & string}.${TableColumnNames<DB, TableName>}`

export type ColumnNamesAccountingForJoinedAssociations<
  JoinedAssociations extends Readonly<JoinedAssociation[]>,
  DB,
  RootTableName extends keyof DB,
  RootTableAlias extends string,
> = JoinedAssociations['length'] extends 0
  ? TableColumnNames<DB, RootTableName> // no associations; simply return the un-namespaced columns for the root table
  : JoinedAssociationColumnNames<
      JoinedAssociations,
      DB,
      // namespace columns for the root table
      AssociationNameToDotReferencedColumns<DB, RootTableName & keyof DB, RootTableAlias>
    >
type JoinedAssociationColumnNames<
  JoinedAssociations extends Readonly<JoinedAssociation[]>,
  DB,
  AllColumnNames,
  Depth extends number = 0,
  CurrentJoinedAssociation = Readonly<JoinedAssociations[0]>,
  NextTableName = CurrentJoinedAssociation extends Readonly<JoinedAssociation>
    ? CurrentJoinedAssociation['table']
    : never,
  NextAssociationName = CurrentJoinedAssociation extends Readonly<JoinedAssociation>
    ? CurrentJoinedAssociation['alias']
    : never,
> = JoinedAssociations['length'] extends 0
  ? AllColumnNames
  : Depth extends MAX_JOINED_TABLES_DEPTH
    ? AllColumnNames
    : JoinedAssociationColumnNames<
        ReadonlyTail<JoinedAssociations>,
        DB,
        | AllColumnNames
        | AssociationNameToDotReferencedColumns<DB, NextTableName & keyof DB, NextAssociationName>,
        Inc<Depth>
      >

export type WhereStatement<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<MergeUnionOfRecordTypes<Updateable<DB[TableName]> | DreamSelectable<DB, Schema, TableName>>>

export type OnStatementForAssociation<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
  OnStatement extends WhereStatement<DB, Schema, TableName> = WhereStatement<DB, Schema, TableName>,
> = RequiredOnClauseKeysForThisAssociation extends null
  ? WhereStatement<DB, Schema, TableName>
  : RequiredOnClauseKeysForThisAssociation extends string[]
    ? Required<Pick<OnStatement, RequiredOnClauseKeysForThisAssociation[number] & keyof OnStatement>> &
        Partial<Omit<OnStatement, RequiredOnClauseKeysForThisAssociation[number] & keyof OnStatement>>
    : never
// on statement on an association definition
type OnStatementForAssociationDefinition<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<
  MergeUnionOfRecordTypes<
    | Updateable<DB[TableName]>
    | Partial<{
        [ColumnName in keyof DB[TableName]]:
          | NonKyselySupportedSupplementalWhereClauseValues<DB, Schema, TableName, ColumnName>
          | typeof DreamConst.passthrough
          | typeof DreamConst.required
      }>
  >
>

export type SelfOnStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<Record<keyof DB[TableName], DreamColumnNames<BaseInstance>>>

export type WhereStatementForJoinedAssociation<
  JoinedAssociations extends Readonly<JoinedAssociation[]>,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = RecursiveWhereStatementForJoinedAssociation<
  JoinedAssociations,
  DB,
  Schema,
  WhereStatement<DB, Schema, TableName>
>
type RecursiveWhereStatementForJoinedAssociation<
  JoinedAssociations extends Readonly<JoinedAssociation[]>,
  DB,
  Schema,
  OriginalOnStatement,
  Depth extends number = 0,
  CurrentJoinedAssociation = JoinedAssociations[0],
  TableName = CurrentJoinedAssociation extends JoinedAssociation ? CurrentJoinedAssociation['table'] : never,
  AssociationName = CurrentJoinedAssociation extends JoinedAssociation
    ? CurrentJoinedAssociation['alias']
    : never,
  NonNamespacedAssociationOnStatement = TableName extends never
    ? never
    : AssociationName extends never
      ? never
      : WhereStatement<DB, Schema, TableName & AssociationTableNames<DB, Schema> & keyof DB>,
  NextOnStatement = NonNamespacedAssociationOnStatement extends never
    ? OriginalOnStatement
    : OriginalOnStatement & {
        [K in keyof NonNamespacedAssociationOnStatement as `${AssociationName & string}.${K & string}`]: NonNamespacedAssociationOnStatement[K &
          keyof NonNamespacedAssociationOnStatement]
      },
> = JoinedAssociations['length'] extends 0
  ? OriginalOnStatement
  : Depth extends MAX_JOINED_TABLES_DEPTH
    ? OriginalOnStatement
    : TableName extends never
      ? OriginalOnStatement
      : RecursiveWhereStatementForJoinedAssociation<
          ReadonlyTail<JoinedAssociations>,
          DB,
          Schema,
          NextOnStatement,
          Inc<Depth>
        >

export type OrderStatement<DB, Schema, TableName extends AssociationTableNames<DB, Schema> & keyof DB> =
  | TableColumnNames<DB, TableName>
  | Partial<Record<TableColumnNames<DB, TableName>, OrderDir>>

export type LimitStatement = number
export type OffsetStatement = number

export type OrderQueryStatement<ColumnType> = {
  column: ColumnType & string
  direction: OrderDir
}

export interface HasStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB,
  HasType extends 'HasOne' | 'HasMany',
> {
  modelCB: () => typeof Dream
  as: string
  dependent?: DependentOptions
  foreignKey: () => keyof DB[ForeignTableName] & string
  foreignKeyTypeField: () => keyof DB[ForeignTableName] & string
  globalAssociationNameOrNames: string[]
  and?: OnStatementForAssociationDefinition<DB, Schema, ForeignTableName>
  andNot?: WhereStatement<DB, Schema, ForeignTableName>
  andAny?: WhereStatement<DB, Schema, ForeignTableName>[]
  // ATTENTION
  //
  // Using `order` with HasOne is tempting as an elegant API
  // (e.g. a `currentXyz` variant of a `currentXyzs` HasMany
  // association by ordering on `createdAt`); however, it
  // creates a fundamental problem when querying through the
  // HasMany association: we can't `limit(1)` as part of the
  // query because multiple records may match the HasMany
  // association, each of which may HaveOne of the subsequent
  // association
  polymorphic: boolean
  preloadThroughColumns?: string[] | Record<string, string>
  primaryKey: (associationInstance?: Dream) => DreamColumnNames<BaseInstance>
  primaryKeyOverride?: DreamColumnNames<BaseInstance> | null
  primaryKeyValue: (associationInstance: Dream) => any
  selfAnd?: SelfOnStatement<BaseInstance, DB, Schema, ForeignTableName>
  selfAndNot?: SelfOnStatement<BaseInstance, DB, Schema, ForeignTableName>
  source: string
  through?: string
  type: HasType
  withoutDefaultScopes?: DefaultScopeName<BaseInstance>[]
}

interface HasOptionsBase<BaseInstance extends Dream, AssociationTableName extends keyof Dream['DB']> {
  dependent?: DependentOptions
  ham?: AssociationTableName
  foreignKey?: TableColumnNames<BaseInstance['DB'], AssociationTableName & keyof BaseInstance['DB']>

  and?: OnStatementForAssociationDefinition<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  andNot?: WhereStatement<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  andAny?: WhereStatement<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >[]

  polymorphic?: boolean
  preloadThroughColumns?: string[] | Record<string, string>
  primaryKeyOverride?: DreamColumnNames<BaseInstance> | null

  selfAnd?: SelfOnStatement<
    BaseInstance,
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  selfAndNot?: SelfOnStatement<
    BaseInstance,
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  source?: string
  through?: keyof BaseInstance['schema'][BaseInstance['table']]['associations']

  withoutDefaultScopes?: DefaultScopeNameForTable<
    BaseInstance['schema'],
    AssociationTableName & keyof BaseInstance['DB']
  >[]
}

export type PolymorphicOption = 'polymorphic'
export type ForeignKeyOption = 'foreignKey'
type ThroughIncompatibleOptions =
  | 'dependent'
  | 'primaryKeyOverride'
  | 'withoutDefaultScopes'
  | ForeignKeyOption
  | PolymorphicOption
type ThroughOnlyOptions = 'through' | 'source' | 'preloadThroughColumns'

export type HasOptions<
  BaseInstance extends Dream,
  AssociationTableName extends keyof BaseInstance['DB'],
> = Omit<HasOptionsBase<BaseInstance, AssociationTableName>, ThroughOnlyOptions | PolymorphicOption>

export type PolymorphicHasOptions<
  BaseInstance extends Dream,
  AssociationTableName extends keyof BaseInstance['DB'],
> = HasOptionsBase<BaseInstance, AssociationTableName> &
  Required<Pick<HasOptionsBase<BaseInstance, AssociationTableName>, PolymorphicOption | ForeignKeyOption>>

export type HasThroughOptions<
  BaseInstance extends Dream,
  AssociationTableName extends BaseInstance['DB'],
> = Omit<HasOptionsBase<BaseInstance, AssociationTableName>, ThroughIncompatibleOptions>

export interface AssociationStatementsMap {
  belongsTo: readonly BelongsToStatement<any, any, any, any>[] | BelongsToStatement<any, any, any, any>[]
  hasMany: readonly HasManyStatement<any, any, any, any>[] | HasManyStatement<any, any, any, any>[]
  hasOne: readonly HasOneStatement<any, any, any, any>[] | HasOneStatement<any, any, any, any>[]
}

export type DependentOptions = 'destroy'
type partialTypeFields =
  | 'modelCB'
  | 'type'
  | 'polymorphic'
  | 'as'
  | 'primaryKey'
  | 'primaryKeyValue'
  | 'primaryKeyOverride'
type hasOneManySpecificFields =
  | 'source'
  | 'through'
  | 'preloadThroughColumns'
  | 'and'
  | 'andNot'
  | 'andAny'
  | 'selfAnd'
  | 'selfAndNot'
type belongsToSpecificFields = 'optional'

export type PartialAssociationStatement =
  | Pick<HasManyStatement<any, any, any, any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<HasOneStatement<any, any, any, any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<BelongsToStatement<any, any, any, any>, partialTypeFields | belongsToSpecificFields>

export type AssociationStatement =
  | HasManyStatement<any, any, any, any>
  | HasOneStatement<any, any, any, any>
  | BelongsToStatement<any, any, any, any>
