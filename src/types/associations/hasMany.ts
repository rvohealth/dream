import Dream from '../../Dream.js'
import { AssociationTableNames } from '../db.js'
import { GlobalModelNameTableMap, TableColumnNames } from '../dream.js'
import {
  HasOptions,
  HasStatement,
  HasThroughOptions,
  OrderStatement,
  PolymorphicHasOptions,
} from './shared.js'

export type HasManyStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasMany'> & {
  distinct?: TableColumnNames<DB, ForeignTableName>
  order?: OrderStatement<DB, Schema, ForeignTableName>
}
interface HasManyOnlyOptions<
  BaseInstance extends Dream,
  AssociationTableName extends keyof BaseInstance['DB'],
> {
  distinct?:
    | TableColumnNames<
        BaseInstance['DB'],
        AssociationTableName &
          AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
          keyof BaseInstance['DB']
      >
    | boolean

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
}

export type HasManyOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = HasOptions<BaseInstance, AssociationGlobalName> & HasManyOnlyOptions<BaseInstance, AssociationGlobalName>

export type PolymorphicHasManyOptions<
  BaseInstance extends Dream,
  AssociationTableName extends keyof BaseInstance['DB'],
> = PolymorphicHasOptions<BaseInstance, AssociationTableName> &
  HasManyOnlyOptions<BaseInstance, AssociationTableName>

export type HasManyThroughOptions<
  BaseInstance extends Dream,
  AssociationTableName extends keyof BaseInstance['DB'],
> = HasThroughOptions<BaseInstance, AssociationTableName> &
  HasManyOnlyOptions<BaseInstance, AssociationTableName>
