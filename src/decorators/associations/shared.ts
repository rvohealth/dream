import Dream from '../../dream'
import { singular } from 'pluralize'
import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { Range } from '../../helpers/range'
import { AssociationTableNames } from '../../db/reflections'
import {
  DreamBelongsToAssociationMetadata,
  DreamColumnNames,
  DreamConst,
  IdType,
  OrderDir,
  TableColumnNames,
} from '../../dream/types'
import OpsStatement from '../../ops/ops-statement'
import { BelongsToStatement } from './belongs-to'
import { HasManyStatement } from './has-many'
import { HasOneStatement } from './has-one'
import CurriedOpsStatement from '../../ops/curried-ops-statement'
import { MergeUnionOfRecordTypes, UnionToIntersection } from '../../helpers/typeutils'
import { checkForeignKey } from '../../exceptions/associations/explicit-foreign-key'
import camelize from '../../helpers/camelize'
import NonLoadedAssociation from '../../exceptions/associations/non-loaded-association'
import associationToGetterSetterProp from './associationToGetterSetterProp'
import CalendarDate from '../../helpers/CalendarDate'

type AssociatedModelType<
  I extends Dream,
  AssociationName extends keyof DreamBelongsToAssociationMetadata<I>,
  PossibleArrayAssociationType extends I[AssociationName & keyof I] = I[AssociationName & keyof I],
  AssociationType extends PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType,
> = AssociationType & Dream

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

export type PassthroughWhere<AllColumns extends string[]> = Partial<Record<AllColumns[number], any>>

type DreamSelectable<DB, Schema, TableName extends AssociationTableNames<DB, Schema> & keyof DB> = Partial<
  Record<
    keyof DB[TableName],
    | Range<DateTime>
    | (() => Range<DateTime>)
    | Range<CalendarDate>
    | (() => Range<CalendarDate>)
    | Range<number>
    | OpsStatement<any, any>
    | CurriedOpsStatement<any, any, any>
    | (IdType | string | number)[]
    | SelectQueryBuilder<DB, keyof DB, any>
  >
>

type AssociationDreamSelectable<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<
  Record<
    keyof DB[TableName],
    | Range<DateTime>
    | (() => Range<DateTime>)
    | Range<CalendarDate>
    | (() => Range<CalendarDate>)
    | Range<number>
    | OpsStatement<any, any>
    | CurriedOpsStatement<any, any, any>
    | (IdType | string | number)[]
    | SelectQueryBuilder<DB, keyof DB, any>
    | typeof DreamConst.passthrough
  >
>

export type WhereStatementForDreamClass<DreamClass extends typeof Dream> = WhereStatement<
  InstanceType<DreamClass>['DB'],
  InstanceType<DreamClass>['dreamconf']['schema'],
  InstanceType<DreamClass>['table']
>

export type WhereStatementForDream<DreamInstance extends Dream> = WhereStatement<
  DreamInstance['DB'],
  DreamInstance['dreamconf']['schema'],
  DreamInstance['table']
>

export type WhereStatement<
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = Partial<MergeUnionOfRecordTypes<Updateable<DB[TableName]> | DreamSelectable<DB, Schema, TableName>>>

export type AssociationWhereStatement<
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
  where?: AssociationWhereStatement<DB, Schema, ForeignTableName>
  whereNot?: WhereStatement<DB, Schema, ForeignTableName>
  selfWhere?: WhereSelfStatement<BaseInstance, DB, Schema, ForeignTableName>
  selfWhereNot?: WhereSelfStatement<BaseInstance, DB, Schema, ForeignTableName>
  distinct?: TableColumnNames<DB, ForeignTableName>
  order?: OrderStatement<DB, Schema, ForeignTableName>
}

export interface HasOptions<BaseInstance extends Dream, AssociationDreamClass extends typeof Dream> {
  foreignKey?: DreamColumnNames<InstanceType<AssociationDreamClass>>
  primaryKeyOverride?: DreamColumnNames<BaseInstance> | null
  through?: keyof BaseInstance['dreamconf']['schema'][BaseInstance['table']]['associations']
  polymorphic?: boolean
  source?: string
  where?: AssociationWhereStatement<
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['dreamconf']['schema'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['dreamconf']['schema']
      >
  >
  whereNot?: WhereStatement<
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['dreamconf']['schema'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['dreamconf']['schema']
      >
  >

  selfWhere?: WhereSelfStatement<
    BaseInstance,
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['dreamconf']['schema'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['dreamconf']['schema']
      >
  >

  selfWhereNot?: WhereSelfStatement<
    BaseInstance,
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['dreamconf']['schema'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['dreamconf']['schema']
      >
  >

  order?:
    | OrderStatement<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['dreamconf']['schema'],
        InstanceType<AssociationDreamClass>['table'] &
          AssociationTableNames<
            InstanceType<AssociationDreamClass>['DB'],
            InstanceType<AssociationDreamClass>['dreamconf']['schema']
          >
      >
    | OrderStatement<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['dreamconf']['schema'],
        InstanceType<AssociationDreamClass>['table'] &
          AssociationTableNames<
            InstanceType<AssociationDreamClass>['DB'],
            InstanceType<AssociationDreamClass>['dreamconf']['schema']
          >
      >[]
  preloadThroughColumns?: string[] | Record<string, string>
}

export function blankAssociationsFactory(dreamClass: typeof Dream): {
  belongsTo: BelongsToStatement<any, any, any, any>[]
  hasMany: HasManyStatement<any, any, any, any>[]
  hasOne: HasOneStatement<any, any, any, any>[]
} {
  return {
    belongsTo: [...(dreamClass['associations']?.belongsTo || [])],
    hasMany: [...(dreamClass['associations']?.hasMany || [])],
    hasOne: [...(dreamClass['associations']?.hasOne || [])],
  }
}

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

// function hydratedSourceValue(dream: Dream | typeof Dream | undefined, sourceName: string) {
//   if (!dream) return
//   if (!sourceName) return
//   return (dream as any)[sourceName] || (dream as any)[singular(sourceName)]
// }
