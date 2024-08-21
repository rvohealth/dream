"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lookupModelByGlobalNameOrNames_1 = __importDefault(require("../../dream-application/helpers/lookupModelByGlobalNameOrNames"));
const shared_1 = require("./shared");
/**
 * Establishes a "HasOne" association between the base dream
 * and the child dream, where the child dream has a foreign key
 * which points back to the base dream.
 *
 * ```ts
 * class User extends ApplicationModel {
 *   @User.HasOne('UserSettings')
 *   public userSettings: UserSettings
 * }
 *
 * class UserSettings extends ApplicationModel {
 *   @UserSettings.BelongsTo('User')
 *   public user: User
 *   public userId: DreamColumn<UserSettings, 'userId'>
 * }
 * ```
 *
 * @param opts.dependent - Can be either "destroy" or undefined. If "destroy", this record will be cascade deleted if the base model is destroyed.
 * @param opts.foreignKey - A custom column name to use for the foreign key.
 * @param opts.order - A custom order statement to apply to this association.
 * @param opts.polymorphic - If true, this association will be treated as a polymorphic association.
 * @param opts.preloadThroughColumns - An array of columns to pluck off the through association attached to this association. Can only be set if `through` is also set.
 * @param opts.primaryKeyOverride - A custom column name to use for the primary key.
 * @param opts.selfWhere - Adds a where clause to an association between a column on the associated model and a column on this model.
 * @param opts.selfWhereNot - Adds a where not clause to an association between a column on the associated model and a column on this model.
 * @param opts.source - Used in conjunction with 'through' to specify the source association on a child model.
 * @param opts.through - If passed, this association will travel through another association.
 * @param opts.where - A where clause to be applied when this association is loaded
 * @param opts.whereNot - A where not clause to be applied when this association is loaded
 * @param opts.withoutDefaultScopes - A list of default scopes to bypass when loading this association
 */
function HasOne(globalAssociationNameOrNames, opts = {}) {
    const { dependent, foreignKey, order, polymorphic = false, preloadThroughColumns, primaryKeyOverride = null, selfWhere, selfWhereNot, source, through, where, whereNot, withoutDefaultScopes, } = opts;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, _) {
        const dreamClass = target.constructor;
        if (!Object.getOwnPropertyDescriptor(dreamClass, 'associations'))
            dreamClass['associationMetadataByType'] = (0, shared_1.blankAssociationsFactory)(dreamClass);
        (0, shared_1.validateHasStatementArgs)({
            dreamClass,
            dependent: dependent ?? null,
            methodName: key,
            where: where ?? null,
        });
        const partialAssociation = (0, shared_1.associationPrimaryKeyAccessors)({
            modelCB: () => (0, lookupModelByGlobalNameOrNames_1.default)(globalAssociationNameOrNames),
            globalAssociationNameOrNames,
            type: 'HasOne',
            as: key,
            polymorphic,
            source: source || key,
            through,
            preloadThroughColumns,
            where,
            whereNot,
            selfWhere,
            selfWhereNot,
            distinct: null,
            order,
            primaryKeyOverride,
            dependent,
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
        dreamClass['associationMetadataByType']['hasOne'].push(association);
        (0, shared_1.applyGetterAndSetter)(target, association);
    };
}
exports.default = HasOne;
