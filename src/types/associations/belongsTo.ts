import Dream from '../../Dream.js'
import { AssociationTableNames } from '../db.js'
import {
  DefaultScopeName,
  DefaultScopeNameForTable,
  DreamColumnNames,
  GlobalModelNames,
  TableColumnNames,
  TableNameForGlobalModelName,
} from '../dream.js'

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
  primaryKey: (
    associationInstance?: Dream | undefined,
    opts?: { associatedClassOverride?: typeof Dream | undefined }
  ) => keyof DB[TableName] & string
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
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
  AssociationGlobalName = AssociationGlobalNameOrNames extends Readonly<any[]>
    ? AssociationGlobalNameOrNames[0] & string
    : AssociationGlobalNameOrNames & string,
  AssociationTableName extends AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
    keyof BaseInstance['DB'] = TableNameForGlobalModelName<
    BaseInstance,
    AssociationGlobalName & GlobalModelNames<BaseInstance>
  > &
    AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
    keyof BaseInstance['DB'],
> {
  foreignKey?: DreamColumnNames<BaseInstance>
  primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null
  optional?: boolean
  withoutDefaultScopes?: DefaultScopeNameForTable<BaseInstance['schema'], AssociationTableName>[]
}

export interface PolymorphicBelongsToOptions<
  BaseInstance extends Dream,
  AssociationGlobalNameOrNames extends
    | GlobalModelNames<BaseInstance>
    | readonly GlobalModelNames<BaseInstance>[],
  AssociationGlobalName = AssociationGlobalNameOrNames extends Readonly<any[]>
    ? AssociationGlobalNameOrNames[0] & string
    : AssociationGlobalNameOrNames & string,
  AssociationTableName extends AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
    keyof BaseInstance['DB'] = TableNameForGlobalModelName<
    BaseInstance,
    AssociationGlobalName & GlobalModelNames<BaseInstance>
  > &
    AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> &
    keyof BaseInstance['DB'],
> {
  foreignKey: DreamColumnNames<BaseInstance>
  primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null
  optional?: boolean
  polymorphic: boolean
  withoutDefaultScopes?: DefaultScopeNameForTable<BaseInstance['schema'], AssociationTableName>[]
}
