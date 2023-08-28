import Dream from '../../dream'
import pluralize = require('pluralize')
import { DB } from '../../sync/schema'
import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { Range } from '../../helpers/range'
import { AssociationTableNames } from '../../db/reflections'
import { IdType } from '../../dream/types'
import OpsStatement from '../../ops/ops-statement'
import { BelongsToStatement } from './belongs-to'
import { HasManyStatement } from './has-many'
import { HasOneStatement } from './has-one'
import { SyncedBelongsToAssociations } from '../../sync/associations'
import CurriedOpsStatement from '../../ops/curried-ops-statement'
import { MergeUnionOfRecordTypes } from '../../helpers/typeutils'
import { checkForeignKey } from '../../exceptions/associations/explicit-foreign-key'
import camelize from '../../../shared/helpers/camelize'

export type AssociatedModelParam<
  I extends Dream,
  AssociationName = keyof SyncedBelongsToAssociations[I['table'] & keyof SyncedBelongsToAssociations],
  PossibleArrayAssociationType = I[AssociationName & keyof I],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType
> = Partial<Record<AssociationName & string, AssociationType | null>>

type DreamSelectable<TableName extends AssociationTableNames> = Partial<
  Record<
    keyof DB[TableName],
    | Range<DateTime>
    | (() => Range<DateTime>)
    | Range<number>
    | OpsStatement
    | CurriedOpsStatement<any, any>
    | (IdType | string | number)[]
    | SelectQueryBuilder<DB, keyof DB, any>
  >
>

export type WhereStatement<TableName extends AssociationTableNames> = Partial<
  MergeUnionOfRecordTypes<Updateable<DB[TableName]> | DreamSelectable<TableName>>
>

export type LimitStatement = { count: number }

export interface HasStatement<
  ForeignTableName extends AssociationTableNames,
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
  where?: WhereStatement<ForeignTableName>
  whereNot?: WhereStatement<ForeignTableName>
}

export function blankAssociationsFactory(dreamClass: typeof Dream): {
  belongsTo: BelongsToStatement<any>[]
  hasMany: HasManyStatement<any>[]
  hasOne: HasOneStatement<any>[]
} {
  return {
    belongsTo: [...(dreamClass.associations?.belongsTo || [])],
    hasMany: [...(dreamClass.associations?.hasMany || [])],
    hasOne: [...(dreamClass.associations?.hasOne || [])],
  }
}

type partialTypeFields = 'modelCB' | 'type' | 'polymorphic' | 'as'
type hasOneManySpecificFields = 'source' | 'through' | 'where' | 'whereNot'
type belongsToSpecificFields = 'optional'

export type PartialAssociationStatement =
  | Pick<HasManyStatement<any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<HasOneStatement<any>, partialTypeFields | hasOneManySpecificFields>
  | Pick<BelongsToStatement<any>, partialTypeFields | belongsToSpecificFields>

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
  if (partialAssociation.modelCB().constructor === Array)
    throw `${dreamClass.name} association ${partialAssociation.as} is incompatible with array of ${partialAssociation.type} Dream types`

  return partialAssociation.modelCB() as typeof Dream
}
