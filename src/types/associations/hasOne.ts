import { AssociationTableNames } from '../../db/reflections.js'
import Dream from '../../Dream.js'
import { HasOptions, HasStatement, HasThroughOptions, PolymorphicHasOptions } from '../associations.js'
import { GlobalModelNameTableMap } from '../dream.js'

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
