"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const positionIsInvalid_1 = __importDefault(require("../helpers/positionIsInvalid"));
const scopeArray_1 = __importDefault(require("../helpers/scopeArray"));
const sortableCacheKeyName_1 = __importDefault(require("../helpers/sortableCacheKeyName"));
const sortableCacheValuesName_1 = __importDefault(require("../helpers/sortableCacheValuesName"));
async function beforeSortableSave({ positionField, dream, query, scope, }) {
    const cacheKey = (0, sortableCacheKeyName_1.default)(positionField);
    const cachedValuesName = (0, sortableCacheValuesName_1.default)(positionField);
    const savingChangeToScopeField = (0, scopeArray_1.default)(scope).filter(scopeField => (!dream['getAssociationMetadata'](scopeField) && dream.willSaveChangeToAttribute(scopeField)) ||
        (dream['getAssociationMetadata'](scopeField) &&
            Object.keys(dream.changedAttributes()).includes(dream['getAssociationMetadata'](scopeField).foreignKey()))).length;
    if (!dream.willSaveChangeToAttribute(positionField) && !savingChangeToScopeField)
        return;
    const position = dream[positionField];
    if (await (0, positionIsInvalid_1.default)({ query, dream: dream, scope, position })) {
        if (savingChangeToScopeField) {
            ;
            dream[cacheKey] = dream.changes()[positionField]?.was;
        }
        else {
            if (dream.isPersisted) {
                ;
                dream[positionField] = undefined;
                return;
            }
            else {
                ;
                dream[cacheKey] = dream.changes()[positionField]?.was;
            }
        }
    }
    else {
        ;
        dream[cacheKey] = position;
    }
    // store values to be used in after create/update hook
    const values = {
        position: dream[cacheKey],
        dream: dream,
        positionField,
        scope,
        previousPosition: dream.changes()[positionField]?.was,
        query,
    };
    dream[cachedValuesName] = values;
    if (dream.isPersisted) {
        // if the dream is saved, set the position field to undefined, which will cause
        // the update cycle to ignore the position field. We will proceed to update it in an
        // AfterUpdateCommit hook
        ;
        dream[positionField] = undefined;
    }
    else {
        // if the dream is not saved, set position to 0 to prevent collisions with existing position values.
        // it will be updated in an AfterCreateCommit hook to the correct value after saving.
        ;
        dream[positionField] = 0;
    }
}
exports.default = beforeSortableSave;
