import { AssociationTableNames } from '../../db/reflections.ts'
import Dream from '../../Dream.ts'
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
> = HasOptions<BaseInstance, AssociationGlobalName>

export type PolymorphicHasOneOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = PolymorphicHasOptions<BaseInstance, AssociationGlobalName>

export type HasOneThroughOptions<
  BaseInstance extends Dream,
  AssociationGlobalName extends keyof GlobalModelNameTableMap<BaseInstance>,
> = HasThroughOptions<BaseInstance, AssociationGlobalName>
