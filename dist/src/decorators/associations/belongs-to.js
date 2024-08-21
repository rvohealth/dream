"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lookupModelByGlobalNameOrNames_1 = __importDefault(require("../../dream-application/helpers/lookupModelByGlobalNameOrNames"));
const validates_1 = __importDefault(require("../validations/validates"));
const shared_1 = require("./shared");
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
function BelongsTo(globalAssociationNameOrNames, { foreignKey, optional = false, polymorphic = false, primaryKeyOverride = null, withoutDefaultScopes, } = {}) {
    return function (target, key, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _) {
        const dreamClass = target.constructor;
        if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
            dreamClass['associationMetadataByType'] = (0, shared_1.blankAssociationsFactory)(dreamClass);
        const partialAssociation = (0, shared_1.associationPrimaryKeyAccessors)({
            modelCB: () => (0, lookupModelByGlobalNameOrNames_1.default)(globalAssociationNameOrNames),
            globalAssociationNameOrNames,
            type: 'BelongsTo',
            as: key,
            optional,
            polymorphic,
            primaryKeyOverride,
            withoutDefaultScopes,
        }, dreamClass);
        const association = {
            ...partialAssociation,
            foreignKey() {
                return (0, shared_1.finalForeignKey)(foreignKey, dreamClass, partialAssociation);
            },
            foreignKeyTypeField() {
                return (0, shared_1.foreignKeyTypeField)(foreignKey, dreamClass, partialAssociation);
            },
        };
        dreamClass['associationMetadataByType']['belongsTo'].push(association);
        (0, shared_1.applyGetterAndSetter)(target, association, { isBelongsTo: true, foreignKeyBase: foreignKey });
        if (!optional)
            (0, validates_1.default)('requiredBelongsTo')(target, key);
    };
}
exports.default = BelongsTo;
