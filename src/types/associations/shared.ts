import {
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  Selectable,
  SelectQueryBuilder,
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
  GlobalModelNameTableMap,
  ModelColumnType,
  OrderDir,
  TableColumnEnumTypeArray,
  TableColumnNames,
  TableColumnType,
  TableNameForGlobalModelName,
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

type TypesAllowedForBigintAgainstTheDb = string | bigint | number

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
  ModelPropertyType = ModelColumnType<Schema, TableName, Column>,
  ColumnType = TableColumnType<Schema, TableName, Column>,
  EnumTypeArray extends string[] | null = TableColumnEnumTypeArray<Schema, TableName, Column>,
  //
  PermanentOpsValTypes = null | readonly [],
  OpsValType = EnumTypeArray extends null
    ? ColumnType extends 'bigint'
      ? TypesAllowedForBigintAgainstTheDb | PermanentOpsValTypes
      : ModelPropertyType extends DateTime | CalendarDate
        ? DateTime | CalendarDate | null
        : ModelPropertyType extends number | string
          ? ModelPropertyType | PermanentOpsValTypes
          : never
    : EnumTypeArray extends string[]
      ? EnumTypeArray[number] | PermanentOpsValTypes
      : never,
  //
  PartialTypes = EnumTypeArray extends null
    ? ModelPropertyType extends DateTime
      ?
          | Range<DateTime | CalendarDate>
          | Range<null, DateTime | CalendarDate>
          | (() => Range<DateTime | CalendarDate>)
          | (() => Range<null, DateTime | CalendarDate>)
          | OpsStatement<KyselyComparisonOperatorExpression, OpsValType, any>
      : ModelPropertyType extends CalendarDate
        ?
            | Range<DateTime | CalendarDate>
            | Range<null, DateTime | CalendarDate>
            | (() => Range<DateTime | CalendarDate>)
            | (() => Range<null, DateTime | CalendarDate>)
            | OpsStatement<KyselyComparisonOperatorExpression, OpsValType>
        : ColumnType extends 'bigint'
          ?
              | Range<TypesAllowedForBigintAgainstTheDb>
              | Range<null, TypesAllowedForBigintAgainstTheDb>
              | OpsStatement<KyselyComparisonOperatorExpression, OpsValType, any>
          : ModelPropertyType extends number
            ?
                | Range<ModelPropertyType>
                | Range<null, ModelPropertyType>
                | OpsStatement<KyselyComparisonOperatorExpression, OpsValType, any>
            : ModelPropertyType extends string
              ?
                  | Range<string>
                  | Range<null, string>
                  | OpsStatement<KyselyComparisonOperatorExpression, string, any>
                  | OpsStatement<TrigramOperator, OpsValType, ExtraSimilarityArgs>
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
  InstanceType<DreamClass>
>

// TODO: deprecate, since this is now the same as WhereStatement? it is not used internally, only exported.
export type WhereStatementForDream<DreamInstance extends Dream> = WhereStatement<DreamInstance>

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

type Whereable<R> = {
  [K in keyof Selectable<R>]?: Selectable<R>[K] | Selectable<R>[K][]
}

export type WhereStatement<I extends Dream> = InternalWhereStatement<I, I['DB'], I['schema'], I['table']>

export type InternalWhereStatement<
  I extends Dream,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<
  MergeUnionOfRecordTypes<
    Whereable<DB[TableName]> | DreamSelectable<DB, Schema, TableName> | AssociatedModelParam<I>
  >
>

export type OnStatementForAssociation<
  I extends Dream,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
  RequiredOnClauseKeysForThisAssociation,
  OnStatement extends InternalWhereStatement<I, DB, Schema, TableName> = InternalWhereStatement<
    I,
    DB,
    Schema,
    TableName
  >,
> = RequiredOnClauseKeysForThisAssociation extends null
  ? InternalWhereStatement<I, DB, Schema, TableName>
  : RequiredOnClauseKeysForThisAssociation extends string[]
    ? Required<Pick<OnStatement, RequiredOnClauseKeysForThisAssociation[number] & keyof OnStatement>> &
        Partial<Omit<OnStatement, RequiredOnClauseKeysForThisAssociation[number] & keyof OnStatement>>
    : never

export type OnStatementForSpecificColumns<
  I extends Dream,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
  Columns extends string[],
  OnStatement extends InternalWhereStatement<I, DB, Schema, TableName> = InternalWhereStatement<
    I,
    DB,
    Schema,
    TableName
  >,
> = Pick<OnStatement, Columns[number] & keyof OnStatement>

// on statement on an association definition
type OnStatementForAssociationDefinition<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<
  MergeUnionOfRecordTypes<
    | Partial<Selectable<DB[TableName]>>
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
  I extends Dream,
  JoinedAssociations extends Readonly<JoinedAssociation[]>,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = RecursiveWhereStatementForJoinedAssociation<
  I,
  JoinedAssociations,
  DB,
  Schema,
  InternalWhereStatement<I, DB, Schema, TableName>
>
type RecursiveWhereStatementForJoinedAssociation<
  I extends Dream,
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
      : InternalWhereStatement<I, DB, Schema, TableName & AssociationTableNames<DB, Schema> & keyof DB>,
  NextOnStatement = NonNamespacedAssociationOnStatement extends never
    ? OriginalOnStatement
    : OriginalOnStatement & {
        [K in keyof NonNamespacedAssociationOnStatement as `${AssociationName & string}.${K & string}`]:
          | NonNamespacedAssociationOnStatement[K & keyof NonNamespacedAssociationOnStatement]
          // `| null` so that we can query for models that don't have a particular association
          | null
      },
> = JoinedAssociations['length'] extends 0
  ? OriginalOnStatement
  : Depth extends MAX_JOINED_TABLES_DEPTH
    ? OriginalOnStatement
    : TableName extends never
      ? OriginalOnStatement
      : RecursiveWhereStatementForJoinedAssociation<
          I,
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
  andNot?: InternalWhereStatement<BaseInstance, DB, Schema, ForeignTableName>
  andAny?: InternalWhereStatement<BaseInstance, DB, Schema, ForeignTableName>[]
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

interface HasOptionsBase<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
  ForeignTableName extends
    BaseInstance['schema'][BaseInstance['table']]['associations'][ThroughAssociationName]['tables'][number] = BaseInstance['schema'][BaseInstance['table']]['associations'][ThroughAssociationName]['tables'][number],
  AssociationTableName = TableNameForGlobalModelName<
    BaseInstance,
    AssociationGlobalName & keyof GlobalModelNameTableMap<BaseInstance>
  >,
> {
  dependent?: DependentOptions
  on?: TableColumnNames<BaseInstance['DB'], AssociationTableName & keyof BaseInstance['DB']>

  and?: OnStatementForAssociationDefinition<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  andNot?: InternalWhereStatement<
    BaseInstance,
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  andAny?: InternalWhereStatement<
    BaseInstance,
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >[]

  polymorphic?: boolean
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

  source?: keyof BaseInstance['schema'][ForeignTableName]['associations']
  through?: ThroughAssociationName

  withoutDefaultScopes?: DefaultScopeNameForTable<
    BaseInstance['schema'],
    AssociationTableName & keyof BaseInstance['DB']
  >[]
}

export type PolymorphicOption = 'polymorphic'
export type ForeignKeyOption = 'on'
type ThroughIncompatibleOptions =
  | 'dependent'
  | 'primaryKeyOverride'
  | 'withoutDefaultScopes'
  | ForeignKeyOption
  | PolymorphicOption
type ThroughOnlyOptions = 'through' | 'source'

export type HasOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = Omit<
  HasOptionsBase<BaseInstance, AssociationGlobalName, ThroughAssociationName>,
  ThroughOnlyOptions | PolymorphicOption
>

export type PolymorphicHasOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = HasOptionsBase<BaseInstance, AssociationGlobalName, ThroughAssociationName> &
  Required<
    Pick<
      HasOptionsBase<BaseInstance, AssociationGlobalName, ThroughAssociationName>,
      PolymorphicOption | ForeignKeyOption
    >
  >

export type HasThroughOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = Omit<
  HasOptionsBase<BaseInstance, AssociationGlobalName, ThroughAssociationName>,
  ThroughIncompatibleOptions
>

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
type hasOneManySpecificFields = 'source' | 'through' | 'and' | 'andNot' | 'andAny' | 'selfAnd' | 'selfAndNot'
type belongsToSpecificFields = 'optional'

export type PartialAssociationStatement =
  | Pick<HasManyStatement<any, any, any, any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<HasOneStatement<any, any, any, any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<BelongsToStatement<any, any, any, any>, partialTypeFields | belongsToSpecificFields>

export type AssociationStatement =
  | HasManyStatement<any, any, any, any>
  | HasOneStatement<any, any, any, any>
  | BelongsToStatement<any, any, any, any>
