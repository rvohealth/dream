import { DreamModel } from '../../dream'
import { DB } from '../../sync/schema'
import { SelectQueryBuilder, Updateable } from 'kysely'
import { DateTime } from 'luxon'
import { Range } from '../../helpers/range'
import { OpsStatement } from '../../ops'

export type WhereStatement<TableName extends keyof DB & string> =
  | Updateable<DB[TableName]>
  | Partial<
      Record<
        keyof DB[TableName],
        Range<DateTime> | OpsStatement | (string | number)[] | SelectQueryBuilder<DB, TableName, {}>
      >
    >

export interface HasStatement<
  ForeignTableName extends keyof DB & string,
  HasType extends 'HasOne' | 'HasMany'
> {
  modelCB: () => DreamModel<ForeignTableName, any>
  type: HasType
  to: keyof DB & string
  foreignKey: () => keyof DB[ForeignTableName] & string
  as: string
  throughClass?: () => DreamModel<ForeignTableName, any>
  through?: string
  where?: WhereStatement<ForeignTableName>
}
