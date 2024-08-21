"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getColumnForSortableScope_1 = __importDefault(require("./getColumnForSortableScope"));
const isSortedCorrectly_1 = __importDefault(require("./isSortedCorrectly"));
const scopeArray_1 = __importDefault(require("./scopeArray"));
async function resortAllRecords(dreamClass, positionField, scope) {
    const dreams = await dreamClass.order({ [positionField]: 'asc' }).all();
    const hash = {};
    for (const dream of dreams) {
        const foreignKeys = foreignKeysForScope(dream, scope);
        hash[foreignKeys.join(':')] ||= [];
        hash[foreignKeys.join(':')].push(dream);
    }
    for (const dreamArr of Object.values(hash)) {
        const dreams = dreamArr;
        if ((0, isSortedCorrectly_1.default)(dreams, positionField))
            continue;
        await dreamClass.transaction(async (txn) => {
            let counter = 1;
            for (const dream of dreams) {
                await dreamClass
                    .txn(txn)
                    .where({ [dream.primaryKey]: dream.primaryKeyValue })
                    .toKysely('update')
                    .set({
                    [positionField]: counter++,
                })
                    .execute();
            }
        });
    }
}
exports.default = resortAllRecords;
function foreignKeysForScope(dream, scope) {
    return (0, scopeArray_1.default)(scope)
        .map(singleScope => (0, getColumnForSortableScope_1.default)(dream, singleScope))
        .map(fk => dream[fk]);
}
