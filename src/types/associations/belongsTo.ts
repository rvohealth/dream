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
    associationInstance?: Dream,
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
  /**
   * A custom column name on this model to use as the foreign key for this association,
   * overriding the default convention-based foreign key.
   */
  on?: DreamColumnNames<BaseInstance>

  /**
   * A custom column on the associated model to use as the primary key for this association,
   * instead of the default primary key (e.g., `'uuid'` instead of `'id'`).
   */
  primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null

  /**
   * Whether or not this association is optional. Defaults to `false`.
   * When `false`, a validation is added requiring the foreign key to be present.
   */
  optional?: boolean

  /**
   * A list of default scopes to bypass when loading this association.
   */
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
  /**
   * A custom column name on this model to use as the foreign key for this association.
   * Required for polymorphic BelongsTo associations.
   */
  on: DreamColumnNames<BaseInstance>

  /**
   * A custom column on the associated model to use as the primary key for this association,
   * instead of the default primary key (e.g., `'uuid'` instead of `'id'`).
   */
  primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null

  /**
   * Whether or not this association is optional. Defaults to `false`.
   * When `false`, a validation is added requiring the foreign key to be present.
   */
  optional?: boolean

  /**
   * Marks this as a polymorphic association, where the foreign key and a type column
   * together identify the associated record across multiple tables.
   */
  polymorphic: boolean

  /**
   * A list of default scopes to bypass when loading this association.
   */
  withoutDefaultScopes?: DefaultScopeNameForTable<BaseInstance['schema'], AssociationTableName>[]
}
