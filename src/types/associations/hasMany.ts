import Dream from '../../Dream.js'
import { AssociationTableNames } from '../db.js'
import {
  GlobalModelNames,
  GlobalModelNameTableMap,
  TableColumnNames,
  TableNameForGlobalModelName,
} from '../dream.js'
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
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
  AssociationGlobalName = AssociationGlobalNameOrNames extends any[]
    ? AssociationGlobalNameOrNames[0] & string
    : AssociationGlobalNameOrNames & string,
  AssociationTableName = TableNameForGlobalModelName<
    BaseInstance,
    AssociationGlobalName & GlobalModelNames<BaseInstance>
  >,
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
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = HasOptions<BaseInstance, AssociationGlobalName, ThroughAssociationName> &
  HasManyOnlyOptions<BaseInstance, AssociationGlobalName>

export type PolymorphicHasManyOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = PolymorphicHasOptions<BaseInstance, AssociationGlobalName, ThroughAssociationName> &
  HasManyOnlyOptions<BaseInstance, AssociationGlobalName>

export type HasManyThroughOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = HasThroughOptions<BaseInstance, AssociationGlobalName, ThroughAssociationName> &
  HasManyOnlyOptions<BaseInstance, AssociationGlobalName>
