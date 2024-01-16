import Dream from '../../dream'
import { singular } from 'pluralize'
import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { Range } from '../../helpers/range'
import { AssociationTableNames } from '../../db/reflections'
import { DreamConst, IdType } from '../../dream/types'
import OpsStatement from '../../ops/ops-statement'
import { BelongsToStatement } from './belongs-to'
import { HasManyStatement } from './has-many'
import { HasOneStatement } from './has-one'
import CurriedOpsStatement from '../../ops/curried-ops-statement'
import { MergeUnionOfRecordTypes } from '../../helpers/typeutils'
import { checkForeignKey } from '../../exceptions/associations/explicit-foreign-key'
import camelize from '../../../shared/helpers/camelize'
import NonLoadedAssociation from '../../exceptions/associations/non-loaded-association'
import associationToGetterSetterProp from './associationToGetterSetterProp'

export type AssociatedModelParam<
  I extends Dream,
  AssociationName = keyof I['dreamconf']['syncedBelongsToAssociations'][I['table'] &
    keyof I['dreamconf']['syncedBelongsToAssociations']],
  PossibleArrayAssociationType = I[AssociationName & keyof I],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType
> = Partial<Record<AssociationName & string, AssociationType | null>>

export type PassthroughWhere<AllColumns extends string[]> = Partial<Record<AllColumns[number], any>>

type DreamSelectable<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB
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
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB
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

export type WhereStatement<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB
> = Partial<
  MergeUnionOfRecordTypes<Updateable<DB[TableName]> | DreamSelectable<DB, SyncedAssociations, TableName>>
>

export type AssociationWhereStatement<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB
> = Partial<
  MergeUnionOfRecordTypes<
    Updateable<DB[TableName]> | AssociationDreamSelectable<DB, SyncedAssociations, TableName>
  >
>

export type WhereSelfStatement<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB
> = Partial<Record<keyof DB[TableName], string>>

export type OrderStatement<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB
> =
  | TableColumnName<DB, SyncedAssociations, TableName>
  | [TableColumnName<DB, SyncedAssociations, TableName>, 'asc' | 'desc']

export type LimitStatement = number
export type OffsetStatement = number

export type OrderQueryStatement<ColumnType extends any> = {
  column: ColumnType & string
  direction: 'asc' | 'desc'
}

export type TableColumnName<
  DB extends any,
  SyncedAssociations extends any,
  TableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
  ColumnName extends keyof Table & string = keyof Table & string
> = ColumnName

export interface HasStatement<
  DB extends any,
  SyncedAssociations extends any,
  ForeignTableName extends AssociationTableNames<DB, SyncedAssociations> & keyof DB,
  HasType extends 'HasOne' | 'HasMany'
> {
  modelCB: () => typeof Dream
  type: HasType
  as: string
  foreignKey: () => keyof DB[ForeignTableName] & string
  foreignKeyTypeField: () => keyof DB[ForeignTableName] & string
  polymorphic: boolean
  source: string
  through?: string
  where?: AssociationWhereStatement<DB, SyncedAssociations, ForeignTableName>
  whereNot?: WhereStatement<DB, SyncedAssociations, ForeignTableName>
  selfWhere?: WhereSelfStatement<DB, SyncedAssociations, ForeignTableName>
  distinct?: TableColumnName<DB, SyncedAssociations, ForeignTableName>
  order?: OrderStatement<DB, SyncedAssociations, ForeignTableName>
}

export function blankAssociationsFactory(dreamClass: typeof Dream): {
  belongsTo: BelongsToStatement<any, any, any>[]
  hasMany: HasManyStatement<any, any, any>[]
  hasOne: HasOneStatement<any, any, any>[]
} {
  return {
    belongsTo: [...(dreamClass.associations?.belongsTo || [])],
    hasMany: [...(dreamClass.associations?.hasMany || [])],
    hasOne: [...(dreamClass.associations?.hasOne || [])],
  }
}

type partialTypeFields = 'modelCB' | 'type' | 'polymorphic' | 'as'
type hasOneManySpecificFields = 'source' | 'through' | 'where' | 'whereNot' | 'selfWhere'
type belongsToSpecificFields = 'optional'

export type PartialAssociationStatement =
  | Pick<HasManyStatement<any, any, any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<HasOneStatement<any, any, any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<BelongsToStatement<any, any, any>, partialTypeFields | belongsToSpecificFields>

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

  Object.defineProperty(target, partialAssociation.as, {
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
          associatedModel?.primaryKeyValue
        if (partialAssociation.polymorphic)
          this[foreignKeyTypeField(foreignKeyBase, dreamClass, partialAssociation)] =
            associatedModel?.constructor?.name
      }
    },
  })
}

function hydratedSourceValue(dream: Dream | typeof Dream | undefined, sourceName: string) {
  if (!dream) return
  if (!sourceName) return
  return (dream as any)[sourceName] || (dream as any)[singular(sourceName)]
}
