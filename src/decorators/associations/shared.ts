import Dream from '../../dream'
import { DB } from '../../sync/schema'
import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { Range } from '../../helpers/range'
import { AssociationTableNames, IdType } from '../../db/reflections'
import OpsStatement from '../../ops/ops-statement'
import { BelongsToStatement } from './belongs-to'
import { HasManyStatement } from './has-many'
import { HasOneStatement } from './has-one'
import { SyncedBelongsToAssociations } from '../../sync/associations'
import CurriedOpsStatement from '../../ops/curried-ops-statement'

export type AssociatedModelParam<
  I extends Dream,
  AssociationName = keyof SyncedBelongsToAssociations[I['table'] & keyof SyncedBelongsToAssociations],
  PossibleArrayAssociationType = I[AssociationName & keyof I],
  AssociationType = PossibleArrayAssociationType extends (infer ElementType)[]
    ? ElementType
    : PossibleArrayAssociationType
> = Partial<Record<AssociationName & string, AssociationType | null>>

export type DreamUpdateable<TableName extends AssociationTableNames> = Partial<
  Record<
    keyof DB[TableName],
    | Range<DateTime>
    | (() => Range<DateTime>)
    | Range<number>
    | OpsStatement
    | CurriedOpsStatement<any, any>
    | (IdType | string | number)[]
    | SelectQueryBuilder<DB, keyof DB, {}>
  >
>

export type WhereStatement<TableName extends AssociationTableNames> =
  | Updateable<DB[TableName]>
  | DreamUpdateable<TableName>

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
