import Dream from '../../Dream.js'
import { AssociationTableNames } from '../db.js'
import { DefaultScopeName, DefaultScopeNameForTable, DreamColumnNames, TableColumnNames } from '../dream.js'

export interface BelongsToStatement<
  BaseInstance extends Dream,
  DB,
  Schema,
  TableName extends AssociationTableNames<DB, Schema> & keyof DB,
> {
  modelCB: () => typeof Dream | (typeof Dream)[]
  globalAssociationNameOrNames: string[]
  type: 'BelongsTo'
  as: string
  primaryKey: (associationInstance?: Dream) => keyof DB[TableName] & string
  primaryKeyValue: (associationInstance: Dream | null) => any
  primaryKeyOverride?: (keyof DB[TableName] & string) | null
  foreignKey: () => DreamColumnNames<BaseInstance> & string
  foreignKeyTypeField: () => DreamColumnNames<BaseInstance> & string
  optional: boolean
  distinct: null
  polymorphic: boolean
  withoutDefaultScopes?: DefaultScopeName<BaseInstance>[]
}

export interface NonPolymorphicBelongsToOptions<
  BaseInstance extends Dream,
  AssociationTableName extends keyof BaseInstance['DB'],
> {
  foreignKey?: DreamColumnNames<BaseInstance>
  primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null
  optional?: boolean
  withoutDefaultScopes?: DefaultScopeNameForTable<BaseInstance['schema'], AssociationTableName>[]
}

export interface PolymorphicBelongsToOptions<
  BaseInstance extends Dream,
  AssociationTableName extends keyof BaseInstance['DB'],
> {
  foreignKey: DreamColumnNames<BaseInstance>
  primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null
  optional?: boolean
  polymorphic: boolean
  withoutDefaultScopes?: DefaultScopeNameForTable<BaseInstance['schema'], AssociationTableName>[]
}
