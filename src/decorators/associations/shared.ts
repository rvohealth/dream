import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { singular } from 'pluralize'
import { AssociationTableNames } from '../../db/reflections'
import Dream from '../../dream'
import {
  AssociationTableName,
  DefaultScopeName,
  DefaultScopeNameForTable,
  DreamBelongsToAssociationMetadata,
  DreamColumnNames,
  DreamConst,
  GlobalModelName,
  IdType,
  OrderDir,
  RequiredWhereClauseKeys,
  TableColumnNames,
  TableNameForGlobalModelName,
} from '../../dream/types'
import { checkForeignKey } from '../../exceptions/associations/explicit-foreign-key'
import NonLoadedAssociation from '../../exceptions/associations/non-loaded-association'
import CannotDefineAssociationWithBothDependentAndPassthrough from '../../exceptions/cannot-define-association-with-both-dependent-and-passthrough'
import CannotDefineAssociationWithBothDependentAndRequiredWhereClause from '../../exceptions/cannot-define-association-with-both-dependent-and-required-where-clause'
import CalendarDate from '../../helpers/CalendarDate'
import camelize from '../../helpers/camelize'
import { Range } from '../../helpers/range'
import { MergeUnionOfRecordTypes, UnionToIntersection } from '../../helpers/typeutils'
import CurriedOpsStatement from '../../ops/curried-ops-statement'
import OpsStatement from '../../ops/ops-statement'
import associationToGetterSetterProp from './associationToGetterSetterProp'
import { BelongsToStatement } from './belongs-to'
import { HasManyStatement } from './has-many'
import { HasOneStatement } from './has-one'

type AssociatedModelType<
  I extends Dream,
  AssociationName extends keyof DreamBelongsToAssociationMetadata<I>,
  PossibleArrayAssociationType extends I[AssociationName & keyof I] = I[AssociationName & keyof I],
  AssociationType extends PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType,
> = AssociationType

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
          [K in AssociationName & keyof DreamBelongsToAssociationMetadata<I> & string]: AssociatedModelType<
            I,
            K
          > | null
        },
> = Partial<UnionToIntersection<RetObj>>

export type PassthroughWhere<PassthroughColumns extends string[]> = Partial<
  Record<PassthroughColumns[number], any>
>

type DreamSelectable<DB, Schema, TableName extends AssociationTableNames<DB, Schema> & keyof DB> = Partial<
  Record<keyof DB[TableName], NonKyselySupportedSupplementalWhereClauseValues<DB>>
>

type NonKyselySupportedSupplementalWhereClauseValues<DB> =
  | Range<DateTime>
  | (() => Range<DateTime>)
  | Range<CalendarDate>
  | (() => Range<CalendarDate>)
  | Range<number>
  | OpsStatement<any, any>
  | CurriedOpsStatement<any, any, any>
  // the non-array allowed types are set by Kysely in Updateable
  | (IdType | string | number | bigint)[]
  | SelectQueryBuilder<DB, keyof DB, any>

type AssociationDreamSelectable<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<
  Record<
    keyof DB[TableName],
    | NonKyselySupportedSupplementalWhereClauseValues<DB>
    | typeof DreamConst.passthrough
    | typeof DreamConst.required
  >
>

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

export type WhereStatement<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<MergeUnionOfRecordTypes<Updateable<DB[TableName]> | DreamSelectable<DB, Schema, TableName>>>

export type WhereStatementForAssociation<
  DB,
  Schema,
  TableName extends keyof Schema,
  AssociationName,
  TableNameForAssociation extends AssociationTableName<
    Schema,
    TableName,
    AssociationName
  > = AssociationTableName<Schema, TableName, AssociationName>,
  RequiredWhereClauses = RequiredWhereClauseKeys<Schema, TableName, AssociationName>,
> = RequiredWhereClauses extends null
  ? WhereStatement<DB, Schema, TableNameForAssociation>
  : RequiredWhereClauses extends string[]
    ? Partial<Omit<WhereStatement<DB, Schema, TableNameForAssociation>, RequiredWhereClauses[number]>> &
        Required<
          Pick<
            WhereStatement<DB, Schema, TableNameForAssociation>,
            RequiredWhereClauses[number] & keyof WhereStatement<DB, Schema, TableNameForAssociation>
          >
        >
    : never

// where statement on an association definition
type WhereStatementForAssociationDefinition<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<
  MergeUnionOfRecordTypes<Updateable<DB[TableName]> | AssociationDreamSelectable<DB, Schema, TableName>>
>

export type WhereSelfStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<Record<keyof DB[TableName], DreamColumnNames<BaseInstance>>>

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
  globalAssociationNameOrNames: string[]
  type: HasType
  as: string
  primaryKeyValue: (associationInstance: Dream) => any
  primaryKeyOverride?: DreamColumnNames<BaseInstance> | null
  primaryKey: (associationInstance?: Dream) => DreamColumnNames<BaseInstance>
  foreignKey: () => keyof DB[ForeignTableName] & string
  foreignKeyTypeField: () => keyof DB[ForeignTableName] & string
  polymorphic: boolean
  source: string
  through?: string
  preloadThroughColumns?: string[] | Record<string, string>
  where?: WhereStatementForAssociationDefinition<DB, Schema, ForeignTableName>
  whereNot?: WhereStatement<DB, Schema, ForeignTableName>
  selfWhere?: WhereSelfStatement<BaseInstance, DB, Schema, ForeignTableName>
  selfWhereNot?: WhereSelfStatement<BaseInstance, DB, Schema, ForeignTableName>
  distinct?: TableColumnNames<DB, ForeignTableName>
  order?: OrderStatement<DB, Schema, ForeignTableName>
  dependent?: DependentOptions
  withoutDefaultScopes?: DefaultScopeName<BaseInstance>[]
}

interface HasOptionsBase<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelName<BaseInstance>
    | readonly GlobalModelName<BaseInstance>[],
  AssociationGlobalName = AssociationGlobalNameOrNames extends any[]
    ? AssociationGlobalNameOrNames[0] & string
    : AssociationGlobalNameOrNames & string,
  AssociationTableName = TableNameForGlobalModelName<
    BaseInstance,
    AssociationGlobalName & GlobalModelName<BaseInstance>
  >,
> {
  foreignKey?: TableColumnNames<BaseInstance['DB'], AssociationTableName & keyof BaseInstance['DB']>
  primaryKeyOverride?: DreamColumnNames<BaseInstance> | null
  // through?: BaseInstance['schema'][BaseInstance['table']]['associations'][number]
  through?: keyof BaseInstance['schema'][BaseInstance['table']]['associations']
  polymorphic?: boolean
  source?: string
  where?: WhereStatementForAssociationDefinition<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >
  whereNot?: WhereStatement<
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  selfWhere?: WhereSelfStatement<
    BaseInstance,
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  selfWhereNot?: WhereSelfStatement<
    BaseInstance,
    BaseInstance['DB'],
    BaseInstance['schema'],
    AssociationTableName &
      AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
      keyof BaseInstance['DB']
  >

  order?:
    | OrderStatement<
        BaseInstance['DB'],
        BaseInstance['schema'],
        AssociationTableName &
          AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
          keyof BaseInstance['DB']
      >
    | OrderStatement<
        BaseInstance['DB'],
        BaseInstance['schema'],
        AssociationTableName &
          AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
          keyof BaseInstance['DB']
      >[]

  distinct?:
    | TableColumnNames<
        BaseInstance['DB'],
        AssociationTableName &
          AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
          keyof BaseInstance['DB']
      >
    | boolean

  preloadThroughColumns?: string[] | Record<string, string>
  dependent?: DependentOptions
  withoutDefaultScopes?: DefaultScopeNameForTable<
    BaseInstance['schema'],
    AssociationTableName & keyof BaseInstance['DB']
  >[]
  // withoutDefaultScopes?: AssociationGlobalNameOrNames
}

type ThroughIncompatibleOptions =
  | 'dependent'
  | 'foreignKey'
  | 'polymorphic'
  | 'primaryKeyOverride'
  | 'withoutDefaultScopes'

type ThroughOnlyOptions = 'through' | 'source' | 'preloadThroughColumns'
export type HasManyOnlyOptions = 'distinct'

export type HasOptions<
  BaseInstance extends Dream,
  // AssociationDreamClass extends typeof Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelName<BaseInstance>
    | readonly GlobalModelName<BaseInstance>[],
> = Omit<HasOptionsBase<BaseInstance, AssociationGlobalNameOrNames>, ThroughOnlyOptions>

export type HasThroughOptions<
  BaseInstance extends Dream,
  // AssociationDreamClass extends typeof Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelName<BaseInstance>
    | readonly GlobalModelName<BaseInstance>[] =
    | GlobalModelName<BaseInstance>
    | GlobalModelName<BaseInstance>[],
> = Omit<HasOptionsBase<BaseInstance, AssociationGlobalNameOrNames>, ThroughIncompatibleOptions>

export function blankAssociationsFactory(dreamClass: typeof Dream): {
  belongsTo: BelongsToStatement<any, any, any, any>[]
  hasMany: HasManyStatement<any, any, any, any>[]
  hasOne: HasOneStatement<any, any, any, any>[]
} {
  return {
    belongsTo: [...(dreamClass['associationMetadataByType']?.belongsTo || [])],
    hasMany: [...(dreamClass['associationMetadataByType']?.hasMany || [])],
    hasOne: [...(dreamClass['associationMetadataByType']?.hasOne || [])],
  }
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
  | 'where'
  | 'whereNot'
  | 'selfWhere'
  | 'selfWhereNot'
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

    computedForeignKey = camelize(singular(table)) + 'Id'
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
    throw `${dreamClass.name} association ${partialAssociation.as} is incompatible with array of ${partialAssociation.type} Dream types`

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
  const dreamClass: typeof Dream = target.constructor as typeof Dream

  if (!Object.getOwnPropertyDescriptor(dreamClass.prototype, partialAssociation.as)?.get) {
    Object.defineProperty(dreamClass.prototype, partialAssociation.as, {
      configurable: true,

      get: function (this: any) {
        const value = this[associationToGetterSetterProp(partialAssociation)]
        if (value === undefined)
          throw new NonLoadedAssociation({ dreamClass, associationName: partialAssociation.as })
        else return value
      },

      set: function (this: any, associatedModel: any) {
        this[associationToGetterSetterProp(partialAssociation)] = associatedModel

        if (isBelongsTo) {
          this[finalForeignKey(foreignKeyBase, dreamClass, partialAssociation)] =
            partialAssociation.primaryKeyValue(associatedModel)
          if (partialAssociation.polymorphic)
            this[foreignKeyTypeField(foreignKeyBase, dreamClass, partialAssociation)] =
              associatedModel?.constructor?.name
        }
      },
    })
  }
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
      if (Array.isArray(associationClass) && this.type === 'BelongsTo')
        throw new Error(`
Cannot lookup primaryKey on polymorphic association:
dream class: ${dreamClass.name}
association: ${this.as}
          `)

      return (associationClass as typeof Dream).primaryKey
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
  where,
}: {
  dreamClass: typeof Dream
  dependent: DependentOptions | null
  methodName: string
  where: object | null
}) {
  const hasPassthroughWhere = Object.values(where || {}).find(val => val === DreamConst.passthrough)
  const hasRequiredWhere = Object.values(where || {}).find(val => val === DreamConst.required)
  if (dependent && hasPassthroughWhere)
    throw new CannotDefineAssociationWithBothDependentAndPassthrough(dreamClass, methodName)
  if (dependent && hasRequiredWhere)
    throw new CannotDefineAssociationWithBothDependentAndRequiredWhereClause(dreamClass, methodName)
}

// function hydratedSourceValue(dream: Dream | typeof Dream | undefined, sourceName: string) {
//   if (!dream) return
//   if (!sourceName) return
//   return (dream as any)[sourceName] || (dream as any)[singular(sourceName)]
// }
