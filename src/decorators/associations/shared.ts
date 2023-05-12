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

export type AssociatedModelParam<T extends typeof Dream> = Partial<
  Record<
    keyof SyncedBelongsToAssociations[InstanceType<T>['table']],
    ReturnType<T['associationMap'][keyof T['associationMap']]['modelCB']> extends () => (typeof Dream)[]
      ? InstanceType<
          ReturnType<
            T['associationMap'][keyof T['associationMap']]['modelCB'] & (() => (typeof Dream)[])
          >[number]
        >
      : InstanceType<
          ReturnType<T['associationMap'][keyof T['associationMap']]['modelCB'] & (() => typeof Dream)>
        >
  >
>

export type WhereStatement<TableName extends AssociationTableNames> =
  | Updateable<DB[TableName]>
  | Partial<
      Record<
        keyof DB[TableName],
        Range<DateTime> | OpsStatement | (IdType | string | number)[] | SelectQueryBuilder<DB, TableName, {}>
      >
    >

export interface HasStatement<
  ForeignTableName extends AssociationTableNames,
  HasType extends 'HasOne' | 'HasMany'
> {
  modelCB: () => typeof Dream
  type: HasType
  as: string
  foreignKey: () => keyof DB[ForeignTableName]
  foreignKeyTypeField: () => keyof DB[ForeignTableName]
  polymorphic: boolean
  throughClass?: () => typeof Dream
  through?: string
  where?: WhereStatement<ForeignTableName>
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
