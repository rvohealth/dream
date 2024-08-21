import { AssociationTableNames } from '../../db/reflections';
import Dream from '../../dream';
import { DefaultScopeName, DefaultScopeNameForTable, DreamColumnNames, GlobalModelNames, TableColumnNames, TableNameForGlobalModelName } from '../../dream/types';
/**
 * Establishes a "BelongsTo" association between the base dream
 * and the child dream, where the base dream has a foreign key
 * which points back to the child dream.
 *
 * ```ts
 * class UserSettings extends ApplicationModel {
 *   @UserSettings.BelongsTo('User')
 *   public user: User
 *   public userId: DreamColumn<UserSettings, 'userId'>
 * }
 *
 * class User extends ApplicationModel {
 *   @User.HasOne('UserSettings')
 *   public userSettings: UserSettings
 * }
 * ```
 *
 * @param opts.foreignKey - A custom column name to use for the foreign key.
 * @param opts.optional - Whether or not this association is optional. Defaults to false.
 * @param opts.polymorphic - If true, this association will be treated as a polymorphic association.
 * @param opts.primaryKeyOverride - A custom column name to use for the primary key.
 * @param opts.withoutDefaultScopes - A list of default scopes to bypass when loading this association
 */
export default function BelongsTo<BaseInstance extends Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[]>(globalAssociationNameOrNames: AssociationGlobalNameOrNames, { foreignKey, optional, polymorphic, primaryKeyOverride, withoutDefaultScopes, }?: BelongsToOptions<BaseInstance, AssociationGlobalNameOrNames>): any;
export interface BelongsToStatement<BaseInstance extends Dream, DB, Schema, TableName extends AssociationTableNames<DB, Schema> & keyof DB> {
    modelCB: () => typeof Dream | (typeof Dream)[];
    globalAssociationNameOrNames: string[];
    type: 'BelongsTo';
    as: string;
    primaryKey: (associationInstance?: Dream) => keyof DB[TableName] & string;
    primaryKeyValue: (associationInstance: Dream | null) => any;
    primaryKeyOverride?: (keyof DB[TableName] & string) | null;
    foreignKey: () => DreamColumnNames<BaseInstance> & string;
    foreignKeyTypeField: () => DreamColumnNames<BaseInstance> & string;
    optional: boolean;
    distinct: null;
    polymorphic: boolean;
    withoutDefaultScopes?: DefaultScopeName<BaseInstance>[];
}
export interface BelongsToOptions<BaseInstance extends Dream, AssociationGlobalNameOrNames extends GlobalModelNames<BaseInstance> | readonly GlobalModelNames<BaseInstance>[], AssociationGlobalName = AssociationGlobalNameOrNames extends Readonly<any[]> ? AssociationGlobalNameOrNames[0] & string : AssociationGlobalNameOrNames & string, AssociationTableName extends AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> & keyof BaseInstance['DB'] = TableNameForGlobalModelName<BaseInstance, AssociationGlobalName & GlobalModelNames<BaseInstance>> & AssociationTableNames<BaseInstance['DB'], BaseInstance['schema']> & keyof BaseInstance['DB']> {
    foreignKey?: DreamColumnNames<BaseInstance>;
    primaryKeyOverride?: TableColumnNames<BaseInstance['DB'], AssociationTableName> | null;
    optional?: boolean;
    polymorphic?: boolean;
    withoutDefaultScopes?: DefaultScopeNameForTable<BaseInstance['schema'], AssociationTableName>[];
}
