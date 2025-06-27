import Dream from '../../Dream.js'
import { AssociationTableNames } from '../db.js'
import { GlobalModelNameTableMap } from '../dream.js'
import { HasOptions, HasStatement, HasThroughOptions, PolymorphicHasOptions } from './shared.js'

export type HasOneStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  ForeignTableName extends AssociationTableNames<DB, Schema> & keyof DB,
> = HasStatement<BaseInstance, DB, Schema, ForeignTableName, 'HasOne'>

export type HasOneOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = HasOptions<BaseInstance, AssociationGlobalName, ThroughAssociationName>

export type PolymorphicHasOneOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = PolymorphicHasOptions<BaseInstance, AssociationGlobalName, ThroughAssociationName>

export type HasOneThroughOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
  ThroughAssociationName extends keyof BaseInstance['schema'][BaseInstance['table']]['associations'],
> = HasThroughOptions<BaseInstance, AssociationGlobalName, ThroughAssociationName>
