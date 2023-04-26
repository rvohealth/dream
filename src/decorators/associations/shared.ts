import Dream from '../../dream'
import { DB } from '../../sync/schema'
import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { Range } from '../../helpers/range'
import { AssociationTableNames } from '../../db/reflections'
import OpsStatement from '../../ops/ops-statement'

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
