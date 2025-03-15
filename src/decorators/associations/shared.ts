import {
  ComparisonOperatorExpression as KyselyComparisonOperatorExpression,
  SelectQueryBuilder,
  Updateable,
} from 'kysely'
import { DateTime } from 'luxon'
import pluralize from 'pluralize-esm'
import { AssociationTableNames } from '../../db/reflections.js.js'
import Dream from '../../Dream.js.js'
import {
  DefaultScopeName,
  DefaultScopeNameForTable,
  DreamBelongsToAssociationMetadata,
  DreamColumnNames,
  DreamConst,
  GlobalModelNameTableMap,
  IdType,
  JoinedAssociation,
  OrderDir,
  TableColumnEnumTypeArray,
  TableColumnNames,
  TableColumnType,
  TableNameForGlobalModelName,
  TrigramOperator,
} from '../../dream/types.js'
import { checkForeignKey } from '../../errors/associations/InvalidComputedForeignKey.js.js'
import NonLoadedAssociation from '../../errors/associations/NonLoadedAssociation.js.js'
import CannotDefineAssociationWithBothDependentAndPassthrough from '../../errors/CannotDefineAssociationWithBothDependentAndPassthrough.js.js'
import CannotDefineAssociationWithBothDependentAndRequiredOnClause from '../../errors/CannotDefineAssociationWithBothDependentAndRequiredOnClause.js.js'
import CalendarDate from '../../helpers/CalendarDate.js.js'
import camelize from '../../helpers/camelize.js.js'
import { Range } from '../../helpers/range.js.js'
import {
  Inc,
  MergeUnionOfRecordTypes,
  ReadonlyTail,
  UnionToIntersection,
} from '../../helpers/typeutils.js.js'
import CurriedOpsStatement from '../../ops/curried-ops-statement.js.js'
import OpsStatement, { ExtraSimilarityArgs } from '../../ops/ops-statement.js.js'
import freezeBaseClassArrayMap from '../helpers/freezeBaseClassArrayMap.js.js'
import associationToGetterSetterProp from './associationToGetterSetterProp.js.js'
import { BelongsToStatement } from './BelongsTo.js.js'
import { HasManyStatement } from './HasMany.js.js'
import { HasOneStatement } from './HasOne.js.js'

type MAX_JOINED_TABLES_DEPTH = 25

type AssociatedBelongsToModelType<
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
  on?: OnStatementForAssociationDefinition<DB, Schema, ForeignTableName>
  notOn?: WhereStatement<DB, Schema, ForeignTableName>
  onAny?: WhereStatement<DB, Schema, ForeignTableName>[]
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
  selfOn?: SelfOnStatement<BaseInstance, DB, Schema, ForeignTableName>
  selfNotOn?: SelfOnStatement<BaseInstance, DB, Schema, ForeignTableName>
  source: string
  through?: string
  type: HasType
  withoutDefaultScopes?: DefaultScopeName<BaseInstance>[]
}

interface HasOptionsBase<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  AssociationTableName = TableNameForGlobalModelName<
    BaseInstance,
    AssociationGlobalName & keyof GlobalModelNameTableMap<BaseInstance>
  >,
> {
  dependent?: DependentOptions
  foreignKey?: TableColumnNames<BaseInstance['DB'], AssociationTableName & keyof BaseInstance['DB']>

  on?: OnStatementForAssociationDefinition<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  notOn?: WhereStatement<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  onAny?: WhereStatement<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >[]

  polymorphic?: boolean
  preloadThroughColumns?: string[] | Record<string, string>
  primaryKeyOverride?: DreamColumnNames<BaseInstance> | null

  selfOn?: SelfOnStatement<
    BaseInstance,
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  selfNotOn?: SelfOnStatement<
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
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = Omit<HasOptionsBase<BaseInstance, AssociationGlobalName>, ThroughOnlyOptions | PolymorphicOption>

export type PolymorphicHasOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = HasOptionsBase<BaseInstance, AssociationGlobalName> &
  Required<Pick<HasOptionsBase<BaseInstance, AssociationGlobalName>, PolymorphicOption | ForeignKeyOption>>

export type HasThroughOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = Omit<HasOptionsBase<BaseInstance, AssociationGlobalName>, ThroughIncompatibleOptions>

export interface AssociationStatementsMap {
  belongsTo: readonly BelongsToStatement<any, any, any, any>[] | BelongsToStatement<any, any, any, any>[]
  hasMany: readonly HasManyStatement<any, any, any, any>[] | HasManyStatement<any, any, any, any>[]
  hasOne: readonly HasOneStatement<any, any, any, any>[] | HasOneStatement<any, any, any, any>[]
}

export function blankAssociationsFactory(
  dreamClass: typeof Dream,
  {
    freeze = false,
  }: {
    freeze?: boolean
  } = {}
): AssociationStatementsMap {
  // This pattern allows associations to be defined on a base STI class and on
  // child STI classes. The new `associationsMap` property will be created
  // on the child STI class, but it will include all the associations already
  // declared on the base STI class.
  const associationsMap = {
    belongsTo: [...(dreamClass['associationMetadataByType']?.belongsTo || [])],
    hasMany: [...(dreamClass['associationMetadataByType']?.hasMany || [])],
    hasOne: [...(dreamClass['associationMetadataByType']?.hasOne || [])],
  }

  if (freeze) return freezeBaseClassArrayMap(associationsMap)
  return associationsMap
}

type DependentOptions = 'destroy'

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
  | 'on'
  | 'notOn'
  | 'selfOn'
  | 'selfNotOn'
type belongsToSpecificFields = 'optional'

export type PartialAssociationStatement =
  | Pick<HasManyStatement<any, any, any, any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<HasOneStatement<any, any, any, any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<BelongsToStatement<any, any, any, any>, partialTypeFields | belongsToSpecificFields>

export type AssociationStatement =
  | HasManyStatement<any, any, any, any>
  | HasOneStatement<any, any, any, any>
  | BelongsToStatement<any, any, any, any>

export function finalForeignKey(
  foreignKey: string | undefined,
  dreamClass: typeof Dream,
  partialAssociation: PartialAssociationStatement
): string {
  let computedForeignKey = foreignKey

  if (!computedForeignKey) {
    const table =
      partialAssociation.type === 'BelongsTo'
        ? modelCBtoSingleDreamClass(dreamClass, partialAssociation).table
        : dreamClass.table

    computedForeignKey = camelize(pluralize.singular(table)) + 'Id'
  }

  if (partialAssociation.type === 'BelongsTo' || !partialAssociation.through)
    checkForeignKey(foreignKey, computedForeignKey, dreamClass, partialAssociation)

  return computedForeignKey
}

export function foreignKeyTypeField(
  foreignKey: any,
  dream: typeof Dream,
  partialAssociation: PartialAssociationStatement
): string {
  return finalForeignKey(foreignKey, dream, partialAssociation).replace(/Id$/, 'Type')
}

export function modelCBtoSingleDreamClass(
  dreamClass: typeof Dream,
  partialAssociation: PartialAssociationStatement
): typeof Dream {
  if (Array.isArray(partialAssociation.modelCB()))
    throw new Error(
      `Polymorphic association ${partialAssociation.as} on model ${dreamClass.sanitizedName} requires an explicit foreignKey`
    )

  return partialAssociation.modelCB() as typeof Dream
}

export function applyGetterAndSetter(
  target: Dream,
  partialAssociation: PartialAssociationStatement,
  {
    foreignKeyBase,
    isBelongsTo,
  }: {
    foreignKeyBase?: string
    isBelongsTo?: boolean
  } = {}
) {
  const dreamPrototype = Object.getPrototypeOf(target)
  const dreamClass: typeof Dream = target.constructor as typeof Dream

  Object.defineProperty(dreamPrototype, partialAssociation.as, {
    configurable: true,

    get: function (this: Dream) {
      const value = (this as any)[associationToGetterSetterProp(partialAssociation)]
      if (value === undefined)
        throw new NonLoadedAssociation({ dreamClass, associationName: partialAssociation.as })
      else return value
    },

    set: function (this: Dream, associatedModel: any) {
      /**
       *
       * Modern Javascript sets all properties that do not have an explicit
       * assignment within the constructor to undefined in an implicit constructor.
       * Since the Dream constructor sets the value of properties of instances of
       * classes that extend Dream (e.g. when passing attributes to #new or #create
       * or when loading a model via one of the #find methods or #all), we need to
       * prevent those properties from being set back to undefined. Since all
       * properties corresponding to a database column get a setter, we achieve this
       * protection by including a guard in the setters that returns if this
       * property is set.
       *
       */

      if (this['columnSetterGuardActivated']) return
      ;(this as any)[associationToGetterSetterProp(partialAssociation)] = associatedModel

      if (isBelongsTo) {
        ;(this as any)[finalForeignKey(foreignKeyBase, dreamClass, partialAssociation)] =
          partialAssociation.primaryKeyValue(associatedModel)
        if (partialAssociation.polymorphic)
          (this as any)[foreignKeyTypeField(foreignKeyBase, dreamClass, partialAssociation)] =
            associatedModel?.['sanitizedConstructorName']
      }
    },
  })
}

export function associationPrimaryKeyAccessors(
  partialAssociation: Exclude<PartialAssociationStatement, 'primaryKey' | 'primaryKeyValue'>,
  dreamClass: typeof Dream
): PartialAssociationStatement {
  return {
    ...partialAssociation,

    primaryKey(associationInstance?: Dream) {
      if (this.primaryKeyOverride) return this.primaryKeyOverride
      if (associationInstance) return associationInstance.primaryKey

      const associationClass = this.modelCB()
      if (Array.isArray(associationClass)) {
        throw new Error(`
Cannot lookup primaryKey on polymorphic association:
dream class: ${dreamClass.sanitizedName}
association: ${this.as}
          `)
      }

      return associationClass.primaryKey
    },

    primaryKeyValue(associationInstance: Dream | null) {
      if (associationInstance === undefined) return undefined
      if (associationInstance === null) return null
      return (associationInstance as any)[this.primaryKey(associationInstance)]
    },
  }
}

export function validateHasStatementArgs({
  dreamClass,
  dependent,
  methodName,
  on,
}: {
  dreamClass: typeof Dream
  dependent: DependentOptions | null
  methodName: string
  on: object | null
}) {
  const hasPassthroughOn = Object.values(on || {}).find(val => val === DreamConst.passthrough)
  const hasRequiredOn = Object.values(on || {}).find(val => val === DreamConst.required)
  if (dependent && hasPassthroughOn)
    throw new CannotDefineAssociationWithBothDependentAndPassthrough(dreamClass, methodName)
  if (dependent && hasRequiredOn)
    throw new CannotDefineAssociationWithBothDependentAndRequiredOnClause(dreamClass, methodName)
}

// function hydratedSourceValue(dream: Dream | typeof Dream | undefined, sourceName: string) {
//   if (!dream) return
//   if (!sourceName) return
//   return (dream as any)[sourceName] || (dream as any)[singular(sourceName)]
// }
