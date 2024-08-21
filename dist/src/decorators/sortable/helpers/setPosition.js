"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySortableScopesToQuery = void 0;
const db_1 = __importDefault(require("../../../db"));
const range_1 = __importDefault(require("../../../helpers/range"));
const ops_1 = __importDefault(require("../../../ops"));
const getColumnForSortableScope_1 = __importDefault(require("./getColumnForSortableScope"));
const scopeArray_1 = __importDefault(require("./scopeArray"));
const sortableQueryExcludingDream_1 = __importDefault(require("./sortableQueryExcludingDream"));
async function setPosition({ position, previousPosition, dream, positionField, scope, query, txn, }) {
    if (position) {
        await setPositionFromValue({
            position,
            dream,
            positionField,
            scope,
            previousPosition,
            query,
            txn,
        });
    }
    else {
        await setNewPosition({
            dream,
            positionField,
            scope,
            query,
            txn,
        });
    }
}
exports.default = setPosition;
async function setPositionFromValue({ position, previousPosition, dream, positionField, query, scope, txn, }) {
    const newPosition = position;
    if (txn) {
        await applyUpdates({
            position,
            previousPosition,
            dream,
            positionField,
            query,
            scope,
            txn,
            newPosition,
        });
    }
    else {
        await dream.constructor.transaction(async (txn) => {
            await applyUpdates({
                position,
                previousPosition,
                dream,
                positionField,
                query,
                scope,
                txn,
                newPosition,
            });
        });
    }
    if (txn) {
        await dream.txn(txn).reload();
    }
    else {
        await dream.reload();
    }
}
async function applyUpdates({ position, previousPosition, dream, positionField, query, scope, txn, newPosition, }) {
    await updateConflictingRecords({
        position,
        previousPosition,
        dream,
        positionField,
        query,
        scope,
        txn,
    });
    await updatePreviousScope({
        position,
        previousPosition,
        dream,
        positionField,
        query,
        scope,
        txn,
    });
    await updatePositionForRecord(txn, dream, positionField, newPosition);
}
async function setNewPosition({ dream, positionField, query, scope, txn, }) {
    const newPosition = (await (0, sortableQueryExcludingDream_1.default)(dream, query, scope).max(positionField)) + 1;
    const dbOrTxn = txn ? txn.kyselyTransaction : (0, db_1.default)('primary');
    await dbOrTxn
        .updateTable(dream.table)
        .where(dream.primaryKey, '=', dream.primaryKeyValue)
        .set({
        [positionField]: newPosition,
    })
        .execute();
    if (txn) {
        await dream.txn(txn).reload();
    }
    else {
        await dream.reload();
    }
}
async function updateConflictingRecords({ position, previousPosition, dream, positionField, query, scope, txn, }) {
    const newPosition = position;
    const increasing = previousPosition && previousPosition < newPosition;
    let kyselyQuery = query
        .txn(txn)
        .whereNot({ [dream.primaryKey]: dream.primaryKeyValue })
        .where({
        [positionField]: increasing
            ? (0, range_1.default)(previousPosition, newPosition)
            : (0, range_1.default)(newPosition, previousPosition),
    })
        .toKysely('update')
        .set((eb) => ({
        [positionField]: eb(positionField, increasing ? '-' : '+', 1),
    }));
    kyselyQuery = applySortableScopesToQuery(dream, kyselyQuery, column => dream[column], scope);
    await kyselyQuery.execute();
}
// this function allows us to handle the case where, rather than a position being updated,
// an attribute or association that is tied to the scope is updated. In these contexts, A
// dream is now leaving the scope and entering a new one, in which case we need to make
// sure the previous scope is updated so that holes in the positioning are correctly adapted.
async function updatePreviousScope({ position, dream, positionField, query, scope, txn, }) {
    const savingChangeToScopeField = (0, scopeArray_1.default)(scope).filter(scopeField => (!dream['getAssociationMetadata'](scopeField) && dream.savedChangeToAttribute(scopeField)) ||
        (dream['getAssociationMetadata'](scopeField) &&
            dream.savedChangeToAttribute(dream['getAssociationMetadata'](scopeField).foreignKey()))).length;
    if (dream.changes()[dream.primaryKey] && dream.changes()[dream.primaryKey].was === undefined)
        return;
    if (!savingChangeToScopeField)
        return;
    let kyselyQuery = query
        .txn(txn)
        .whereNot({ [dream.primaryKey]: dream.primaryKeyValue })
        .where({
        [positionField]: ops_1.default.greaterThan(position),
    })
        .toKysely('update')
        .set((eb) => {
        return {
            [positionField]: eb(positionField, '-', 1),
        };
    });
    const changes = dream.changes();
    kyselyQuery = applySortableScopesToQuery(dream, kyselyQuery, column => changes[column]?.was || dream[column], scope);
    await kyselyQuery.execute();
}
function applySortableScopesToQuery(dream, kyselyQuery, whereValueCB, scope) {
    for (const singleScope of (0, scopeArray_1.default)(scope)) {
        const column = (0, getColumnForSortableScope_1.default)(dream, singleScope);
        if (column) {
            kyselyQuery = kyselyQuery.where(column, '=', whereValueCB(column));
        }
    }
    return kyselyQuery;
}
exports.applySortableScopesToQuery = applySortableScopesToQuery;
async function updatePositionForRecord(txn, dream, positionField, position) {
    await txn.kyselyTransaction
        .updateTable(dream.table)
        .where(dream.primaryKey, '=', dream.primaryKeyValue)
        .set({
        [positionField]: position,
    })
        .execute();
}
