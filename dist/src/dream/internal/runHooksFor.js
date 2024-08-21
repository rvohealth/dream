"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHook = void 0;
async function runHooksFor(key, dream, alreadyPersisted, beforeSaveChanges, txn) {
    const Base = dream.constructor;
    for (const statement of Base['hooks'][key]) {
        if (statement.ifChanging?.length) {
            switch (key) {
                case 'beforeCreate':
                    await runConditionalBeforeHooksForCreate(dream, statement, txn);
                    break;
                case 'beforeSave':
                    if (alreadyPersisted)
                        await runConditionalBeforeHooksForUpdate(dream, statement, txn);
                    else
                        await runConditionalBeforeHooksForCreate(dream, statement, txn);
                    break;
                case 'beforeUpdate':
                    await runConditionalBeforeHooksForUpdate(dream, statement, txn);
                    break;
                default:
                    throw new Error(`Unexpected statement key detected with ifChanging clause: ${key}`);
            }
        }
        else if (statement.ifChanged?.length) {
            switch (key) {
                case 'afterCreate':
                case 'afterCreateCommit':
                    await runConditionalAfterHooksForCreate(dream, statement, beforeSaveChanges, txn);
                    break;
                case 'afterSave':
                case 'afterSaveCommit':
                    if (alreadyPersisted)
                        await runConditionalAfterHooksForUpdate(dream, statement, txn);
                    else
                        await runConditionalAfterHooksForCreate(dream, statement, beforeSaveChanges, txn);
                    break;
                case 'afterUpdate':
                case 'afterUpdateCommit':
                    await runConditionalAfterHooksForUpdate(dream, statement, txn);
                    break;
                default:
                    throw new Error(`Unexpected statement key detected with ifChanged clause: ${key}`);
            }
        }
        else {
            await runHook(statement, dream, txn);
        }
    }
}
exports.default = runHooksFor;
async function runHook(statement, dream, txn) {
    if (typeof dream[statement.method] !== 'function') {
        throw new Error(`
Attempting to run ${statement.method} as part of the ${statement.type}
Dream model hook sequence, but we encountered a method that does not exist.

Please make sure "${statement.method}" is defined on ${dream.constructor.name}
`);
    }
    await dream[statement.method](txn);
}
exports.runHook = runHook;
async function runConditionalBeforeHooksForCreate(dream, statement, txn) {
    let shouldRun = false;
    for (const attribute of statement.ifChanging) {
        if (dream[attribute] !== undefined)
            shouldRun = true;
    }
    if (shouldRun)
        await runHook(statement, dream, txn);
}
async function runConditionalAfterHooksForCreate(dream, statement, beforeSaveChanges, txn) {
    let shouldRun = false;
    for (const attribute of statement.ifChanged) {
        if (beforeSaveChanges?.[attribute] &&
            beforeSaveChanges[attribute].was !== beforeSaveChanges[attribute].now)
            shouldRun = true;
    }
    if (shouldRun)
        await runHook(statement, dream, txn);
}
async function runConditionalBeforeHooksForUpdate(dream, statement, txn) {
    let shouldRun = false;
    for (const attribute of statement.ifChanging) {
        if (dream.willSaveChangeToAttribute(attribute))
            shouldRun = true;
    }
    if (shouldRun)
        await runHook(statement, dream, txn);
}
async function runConditionalAfterHooksForUpdate(dream, statement, txn) {
    let shouldRun = false;
    for (const attribute of statement.ifChanged) {
        if (dream.savedChangeToAttribute(attribute))
            shouldRun = true;
    }
    if (shouldRun)
        await runHook(statement, dream, txn);
}
