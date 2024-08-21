"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHasStatementArgs = exports.associationPrimaryKeyAccessors = exports.applyGetterAndSetter = exports.modelCBtoSingleDreamClass = exports.foreignKeyTypeField = exports.finalForeignKey = exports.blankAssociationsFactory = void 0;
const pluralize_1 = require("pluralize");
const types_1 = require("../../dream/types");
const explicit_foreign_key_1 = require("../../exceptions/associations/explicit-foreign-key");
const non_loaded_association_1 = __importDefault(require("../../exceptions/associations/non-loaded-association"));
const cannot_define_association_with_both_dependent_and_passthrough_1 = __importDefault(require("../../exceptions/cannot-define-association-with-both-dependent-and-passthrough"));
const cannot_define_association_with_both_dependent_and_required_where_clause_1 = __importDefault(require("../../exceptions/cannot-define-association-with-both-dependent-and-required-where-clause"));
const camelize_1 = __importDefault(require("../../helpers/camelize"));
const associationToGetterSetterProp_1 = __importDefault(require("./associationToGetterSetterProp"));
function blankAssociationsFactory(dreamClass) {
    return {
        belongsTo: [...(dreamClass['associationMetadataByType']?.belongsTo || [])],
        hasMany: [...(dreamClass['associationMetadataByType']?.hasMany || [])],
        hasOne: [...(dreamClass['associationMetadataByType']?.hasOne || [])],
    };
}
exports.blankAssociationsFactory = blankAssociationsFactory;
function finalForeignKey(foreignKey, dreamClass, partialAssociation) {
    let computedForeignKey = foreignKey;
    if (!computedForeignKey) {
        const table = partialAssociation.type === 'BelongsTo'
            ? modelCBtoSingleDreamClass(dreamClass, partialAssociation).table
            : dreamClass.table;
        computedForeignKey = (0, camelize_1.default)((0, pluralize_1.singular)(table)) + 'Id';
    }
    if (partialAssociation.type === 'BelongsTo' || !partialAssociation.through)
        (0, explicit_foreign_key_1.checkForeignKey)(foreignKey, computedForeignKey, dreamClass, partialAssociation);
    return computedForeignKey;
}
exports.finalForeignKey = finalForeignKey;
function foreignKeyTypeField(foreignKey, dream, partialAssociation) {
    return finalForeignKey(foreignKey, dream, partialAssociation).replace(/Id$/, 'Type');
}
exports.foreignKeyTypeField = foreignKeyTypeField;
function modelCBtoSingleDreamClass(dreamClass, partialAssociation) {
    if (Array.isArray(partialAssociation.modelCB()))
        throw `${dreamClass.name} association ${partialAssociation.as} is incompatible with array of ${partialAssociation.type} Dream types`;
    return partialAssociation.modelCB();
}
exports.modelCBtoSingleDreamClass = modelCBtoSingleDreamClass;
function applyGetterAndSetter(target, partialAssociation, { foreignKeyBase, isBelongsTo, } = {}) {
    const dreamClass = target.constructor;
    if (!Object.getOwnPropertyDescriptor(dreamClass.prototype, partialAssociation.as)?.get) {
        Object.defineProperty(dreamClass.prototype, partialAssociation.as, {
            configurable: true,
            get: function () {
                const value = this[(0, associationToGetterSetterProp_1.default)(partialAssociation)];
                if (value === undefined)
                    throw new non_loaded_association_1.default({ dreamClass, associationName: partialAssociation.as });
                else
                    return value;
            },
            set: function (associatedModel) {
                this[(0, associationToGetterSetterProp_1.default)(partialAssociation)] = associatedModel;
                if (isBelongsTo) {
                    this[finalForeignKey(foreignKeyBase, dreamClass, partialAssociation)] =
                        partialAssociation.primaryKeyValue(associatedModel);
                    if (partialAssociation.polymorphic)
                        this[foreignKeyTypeField(foreignKeyBase, dreamClass, partialAssociation)] =
                            associatedModel?.constructor?.name;
                }
            },
        });
    }
}
exports.applyGetterAndSetter = applyGetterAndSetter;
function associationPrimaryKeyAccessors(partialAssociation, dreamClass) {
    return {
        ...partialAssociation,
        primaryKey(associationInstance) {
            if (this.primaryKeyOverride)
                return this.primaryKeyOverride;
            if (associationInstance)
                return associationInstance.primaryKey;
            const associationClass = this.modelCB();
            if (Array.isArray(associationClass) && this.type === 'BelongsTo')
                throw new Error(`
Cannot lookup primaryKey on polymorphic association:
dream class: ${dreamClass.name}
association: ${this.as}
          `);
            return associationClass.primaryKey;
        },
        primaryKeyValue(associationInstance) {
            if (associationInstance === undefined)
                return undefined;
            if (associationInstance === null)
                return null;
            return associationInstance[this.primaryKey(associationInstance)];
        },
    };
}
exports.associationPrimaryKeyAccessors = associationPrimaryKeyAccessors;
function validateHasStatementArgs({ dreamClass, dependent, methodName, where, }) {
    const hasPassthroughWhere = Object.values(where || {}).find(val => val === types_1.DreamConst.passthrough);
    const hasRequiredWhere = Object.values(where || {}).find(val => val === types_1.DreamConst.required);
    if (dependent && hasPassthroughWhere)
        throw new cannot_define_association_with_both_dependent_and_passthrough_1.default(dreamClass, methodName);
    if (dependent && hasRequiredWhere)
        throw new cannot_define_association_with_both_dependent_and_required_where_clause_1.default(dreamClass, methodName);
}
exports.validateHasStatementArgs = validateHasStatementArgs;
// function hydratedSourceValue(dream: Dream | typeof Dream | undefined, sourceName: string) {
//   if (!dream) return
//   if (!sourceName) return
//   return (dream as any)[sourceName] || (dream as any)[singular(sourceName)]
// }
