import Dream from '../../dream'
import { singular } from 'pluralize'
import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { Range } from '../../helpers/range'
import { AssociationTableNames } from '../../db/reflections'
import { DreamColumns, DreamConst, IdType, OrderDir } from '../../dream/types'
import OpsStatement from '../../ops/ops-statement'
import { BelongsToStatement } from './belongs-to'
import { HasManyStatement } from './has-many'
import { HasOneStatement } from './has-one'
import CurriedOpsStatement from '../../ops/curried-ops-statement'
import { MergeUnionOfRecordTypes } from '../../helpers/typeutils'
import { checkForeignKey } from '../../exceptions/associations/explicit-foreign-key'
import camelize from '../../helpers/camelize'
import NonLoadedAssociation from '../../exceptions/associations/non-loaded-association'
import associationToGetterSetterProp from './associationToGetterSetterProp'

type AssociatedModelType<
  I extends Dream,
  AssociationName extends keyof I['dreamconf']['syncedBelongsToAssociations'][I['table'] &
    keyof I['dreamconf']['syncedBelongsToAssociations']],
  PossibleArrayAssociationType extends I[AssociationName & keyof I] = I[AssociationName & keyof I],
  AssociationType extends PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType,
> = AssociationType & Dream

export type AssociatedModelParam<
  I extends Dream,
  AssociationExists = I['dreamconf']['syncedBelongsToAssociations'][I['table'] &
    keyof I['dreamconf']['syncedBelongsToAssociations']],
  AssociationName = AssociationExists extends false
    ? never
    : keyof I['dreamconf']['syncedBelongsToAssociations'][I['table'] &
        keyof I['dreamconf']['syncedBelongsToAssociations']] &
        string,
> = AssociationExists extends false
  ? never
  : Partial<{ [K in AssociationName & string]: AssociatedModelType<I, K> | null }>

export type PassthroughWhere<AllColumns extends string[]> = Partial<Record<AllColumns[number], any>>

type DreamSelectable<
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> = Partial<
  Record<
    keyof DB[TableName],
    | Range<DateTime>
    | (() => Range<DateTime>)
    | Range<number>
    | OpsStatement<any, any>
    | CurriedOpsStatement<any, any, any>
    | (IdType | string | number)[]
    | SelectQueryBuilder<DB, keyof DB, any>
  >
>

type AssociationDreamSelectable<
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> = Partial<
  Record<
    keyof DB[TableName],
    | Range<DateTime>
    | (() => Range<DateTime>)
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
  InstanceType<DreamClass>['syncedAssociations'],
  InstanceType<DreamClass>['table']
>

export type WhereStatementForDream<DreamInstance extends Dream> = WhereStatement<
  DreamInstance['DB'],
  DreamInstance['syncedAssociations'],
  DreamInstance['table']
>

export type WhereStatement<
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> = Partial<
  MergeUnionOfRecordTypes<Updateable<DB[TableName]> | DreamSelectable<DB, SyncedAssociations, TableName>>
>

export type AssociationWhereStatement<
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> = Partial<
  MergeUnionOfRecordTypes<
    Updateable<DB[TableName]> | AssociationDreamSelectable<DB, SyncedAssociations, TableName>
  >
>

export type WhereSelfStatement<
  BaseInstance extends Dream,
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> = Partial<Record<keyof DB[TableName], DreamColumns<BaseInstance>>>

export type OrderStatement<
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
> =
  | TableColumnName<DB, SyncedAssociations, TableName>
  | Partial<Record<TableColumnName<DB, SyncedAssociations, TableName>, OrderDir>>

export type LimitStatement = number
export type OffsetStatement = number

export type OrderQueryStatement<ColumnType> = {
  column: ColumnType & string
  direction: OrderDir
}

export type TableColumnName<
  DB,
  SyncedAssociations,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
  ColumnName extends keyof Table & string = keyof Table & string,
> = ColumnName

export interface HasStatement<
  BaseInstance extends Dream,
  DB,
  SyncedAssociations,
  ForeignTableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
  HasType extends 'HasOne' | 'HasMany',
> {
  modelCB: () => typeof Dream
  type: HasType
  as: string
  primaryKeyValue: (associationInstance: Dream) => any
  primaryKeyOverride?: DreamColumns<BaseInstance> | null
  primaryKey: (associationInstance?: Dream) => DreamColumns<BaseInstance>
  foreignKey: () => keyof DB[ForeignTableName] & string
  foreignKeyTypeField: () => keyof DB[ForeignTableName] & string
  polymorphic: boolean
  source: string
  through?: string
  preloadThroughColumns?: string[]
  where?: AssociationWhereStatement<DB, SyncedAssociations, ForeignTableName>
  whereNot?: WhereStatement<DB, SyncedAssociations, ForeignTableName>
  selfWhere?: WhereSelfStatement<BaseInstance, DB, SyncedAssociations, ForeignTableName>
  selfWhereNot?: WhereSelfStatement<BaseInstance, DB, SyncedAssociations, ForeignTableName>
  distinct?: TableColumnName<DB, SyncedAssociations, ForeignTableName>
  order?: OrderStatement<DB, SyncedAssociations, ForeignTableName>
}

export interface HasOptions<BaseInstance extends Dream, AssociationDreamClass extends typeof Dream> {
  foreignKey?: DreamColumns<InstanceType<AssociationDreamClass>>
  primaryKeyOverride?: DreamColumns<BaseInstance> | null
  through?: keyof BaseInstance['syncedAssociations'][BaseInstance['table']]
  polymorphic?: boolean
  source?: string
  where?: AssociationWhereStatement<
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['syncedAssociations'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations']
      >
  >
  whereNot?: WhereStatement<
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['syncedAssociations'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations']
      >
  >

  selfWhere?: WhereSelfStatement<
    BaseInstance,
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['syncedAssociations'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations']
      >
  >

  selfWhereNot?: WhereSelfStatement<
    BaseInstance,
    InstanceType<AssociationDreamClass>['DB'],
    InstanceType<AssociationDreamClass>['syncedAssociations'],
    InstanceType<AssociationDreamClass>['table'] &
      AssociationTableNames<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations']
      >
  >

  order?:
    | OrderStatement<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations'],
        InstanceType<AssociationDreamClass>['table'] &
          AssociationTableNames<
            InstanceType<AssociationDreamClass>['DB'],
            InstanceType<AssociationDreamClass>['syncedAssociations']
          >
      >
    | OrderStatement<
        InstanceType<AssociationDreamClass>['DB'],
        InstanceType<AssociationDreamClass>['syncedAssociations'],
        InstanceType<AssociationDreamClass>['table'] &
          AssociationTableNames<
            InstanceType<AssociationDreamClass>['DB'],
            InstanceType<AssociationDreamClass>['syncedAssociations']
          >
      >[]
  preloadThroughColumns?: string[]
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
        ? modelCBtoSingleDreamClass(dreamClass, partialAssociation).prototype.table
        : dreamClass.prototype.table

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

      return (associationClass as any).primaryKey
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
