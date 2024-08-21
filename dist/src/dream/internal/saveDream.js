"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const db_1 = __importDefault(require("../../db"));
const validation_error_1 = __importDefault(require("../../exceptions/validation-error"));
const sqlAttributes_1 = __importDefault(require("../../helpers/sqlAttributes"));
const executeDatabaseQuery_1 = __importDefault(require("./executeDatabaseQuery"));
const runHooksFor_1 = __importDefault(require("./runHooksFor"));
const safelyRunCommitHooks_1 = __importDefault(require("./safelyRunCommitHooks"));
async function saveDream(dream, txn = null, { skipHooks = false } = {}) {
    const db = txn?.kyselyTransaction || (0, db_1.default)('primary');
    const alreadyPersisted = dream.isPersisted;
    if (!skipHooks) {
        if (alreadyPersisted)
            await (0, runHooksFor_1.default)('beforeUpdate', dream, alreadyPersisted, null, txn);
        else
            await (0, runHooksFor_1.default)('beforeCreate', dream, alreadyPersisted, null, txn);
        await (0, runHooksFor_1.default)('beforeSave', dream, alreadyPersisted, null, txn);
    }
    const beforeSaveChanges = dream.changes();
    // need to check validations after running before hooks, or else
    // model hooks that might make a model valid cannot run
    if (dream.isInvalid)
        throw new validation_error_1.default(dream.constructor.name, dream.errors);
    if (alreadyPersisted && !dream.isDirty)
        return dream;
    let query;
    const now = luxon_1.DateTime.now();
    if (!alreadyPersisted && !dream.createdAt && dream.columns().has('createdAt'))
        dream.createdAt = now;
    if (!dream.dirtyAttributes().updatedAt && dream.columns().has('updatedAt'))
        dream.updatedAt = now;
    const sqlifiedAttributes = (0, sqlAttributes_1.default)(dream);
    if (alreadyPersisted) {
        query = db
            .updateTable(dream.table)
            .set(sqlifiedAttributes)
            .where(`${dream.table}.${dream.primaryKey}`, '=', dream.primaryKeyValue);
    }
    else {
        query = db.insertInto(dream.table).values(sqlifiedAttributes);
    }
    // BeforeSave/Update actions may clear all the data that we intended to save, leaving us with
    // an invalid update command. The Sortable decorator is an example of this.
    if (!alreadyPersisted || Object.keys(sqlifiedAttributes).length) {
        const data = await (0, executeDatabaseQuery_1.default)(query.returning([...dream.columns()]), 'executeTakeFirstOrThrow');
        dream['isPersisted'] = true;
        dream.setAttributes(data);
    }
    // set frozen attributes to what has already been saved
    dream['freezeAttributes']();
    dream['attributesFromBeforeLastSave'] = dream['originalAttributes'];
    dream['originalAttributes'] = dream.getAttributes();
    if (!skipHooks) {
        await (0, runHooksFor_1.default)('afterSave', dream, alreadyPersisted, beforeSaveChanges, txn);
        if (alreadyPersisted)
            await (0, runHooksFor_1.default)('afterUpdate', dream, alreadyPersisted, beforeSaveChanges, txn);
        else
            await (0, runHooksFor_1.default)('afterCreate', dream, alreadyPersisted, beforeSaveChanges, txn);
        const commitHookType = alreadyPersisted ? 'afterUpdateCommit' : 'afterCreateCommit';
        await (0, safelyRunCommitHooks_1.default)(dream, commitHookType, alreadyPersisted, beforeSaveChanges, txn);
        await (0, safelyRunCommitHooks_1.default)(dream, 'afterSaveCommit', alreadyPersisted, beforeSaveChanges, txn);
    }
    return dream;
}
exports.default = saveDream;
