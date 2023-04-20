import { DreamModel } from '../../dream'
import { DB } from '../../sync/schema'
import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { Range } from '../../helpers/range'
import { OpsStatement } from '../../ops'
import { AssociationTableNames } from '../../db/reflections'

export type WhereStatement<TableName extends AssociationTableNames> =
  | Updateable<DB[TableName]>
  | Partial<
      Record<
        keyof DB[TableName],
        Range<DateTime> | OpsStatement | (string | number)[] | SelectQueryBuilder<DB, TableName, {}>
      >
    >

export interface HasStatement<
  ForeignTableName extends AssociationTableNames,
  HasType extends 'HasOne' | 'HasMany'
> {
  modelCB: () => DreamModel<ForeignTableName, any>
  type: HasType
  to: AssociationTableNames
  as: string
  foreignKey: () => keyof DB[ForeignTableName]
  foreignKeyTypeField: () => keyof DB[TableName]
  polymorphic: boolean
  throughClass?: () => DreamModel<ForeignTableName, any>
  through?: string
  where?: WhereStatement<ForeignTableName>
}
