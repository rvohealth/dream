"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pascalize_1 = __importDefault(require("../../helpers/pascalize"));
const before_save_1 = __importDefault(require("../hooks/before-save"));
const after_create_commit_1 = __importDefault(require("../hooks/after-create-commit"));
const after_update_commit_1 = __importDefault(require("../hooks/after-update-commit"));
const after_destroy_commit_1 = __importDefault(require("../hooks/after-destroy-commit"));
const beforeSortableSave_1 = __importDefault(require("./hooks/beforeSortableSave"));
const afterSortableDestroy_1 = __importDefault(require("./hooks/afterSortableDestroy"));
const scopeArray_1 = __importDefault(require("./helpers/scopeArray"));
const after_create_1 = __importDefault(require("../hooks/after-create"));
const after_update_1 = __importDefault(require("../hooks/after-update"));
const after_destroy_1 = __importDefault(require("../hooks/after-destroy"));
const afterSortableCreate_1 = __importDefault(require("./hooks/afterSortableCreate"));
const afterSortableUpdate_1 = __importDefault(require("./hooks/afterSortableUpdate"));
function Sortable(opts = {}) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, _) {
        const dreamClass = target.constructor;
        if (!Object.getOwnPropertyDescriptor(dreamClass, 'sortableFields'))
            dreamClass['sortableFields'] = [];
        dreamClass['sortableFields'].push({
            scope: (0, scopeArray_1.default)(opts.scope),
            positionField: key,
        });
        const positionField = key;
        const beforeSaveMethodName = `_cacheValueFor${(0, pascalize_1.default)(key)}`;
        const afterCreateMethodName = `_setNewValueFor${(0, pascalize_1.default)(key)}AfterCreate`;
        const afterCreateCommitMethodName = `_setNewValueFor${(0, pascalize_1.default)(key)}AfterCreateCommit`;
        const afterUpdateMethodName = `_updateValueFor${(0, pascalize_1.default)(key)}AfterUpdate`;
        const afterUpdateCommitMethodName = `_updateValueFor${(0, pascalize_1.default)(key)}AfteUpdateCommit`;
        const afterDestroyMethodName = `_setValuesAfterDestructionFor${(0, pascalize_1.default)(key)}AfterDestroy`;
        const afterDestroyCommitMethodName = `_setValuesAfterDestructionFor${(0, pascalize_1.default)(key)}AfterDestroyCommit`;
        dreamClass.prototype[beforeSaveMethodName] = async function (txn) {
            let query = dreamClass.query();
            if (txn)
                query = query.txn(txn);
            await (0, beforeSortableSave_1.default)({
                dream: this,
                positionField,
                query,
                scope: opts.scope,
            });
        };
        dreamClass.prototype[afterUpdateMethodName] = async function (txn) {
            // if no transaction is provided, leverage update commit hook instead
            if (!txn)
                return;
            const query = dreamClass.query().txn(txn);
            await (0, afterSortableUpdate_1.default)({
                dream: this,
                positionField,
                query,
                scope: opts.scope,
                txn,
            });
        };
        dreamClass.prototype[afterUpdateCommitMethodName] = async function (txn) {
            // if transaction is provided, leverage update hook instead
            if (txn)
                return;
            const query = dreamClass.query();
            await (0, afterSortableUpdate_1.default)({
                dream: this,
                positionField,
                query,
                scope: opts.scope,
            });
        };
        dreamClass.prototype[afterCreateMethodName] = async function (txn) {
            // if no transaction is provided, leverage create commit hook instead
            if (!txn)
                return;
            const query = dreamClass.query().txn(txn);
            await (0, afterSortableCreate_1.default)({
                dream: this,
                positionField,
                query,
                scope: opts.scope,
                txn,
            });
        };
        dreamClass.prototype[afterCreateCommitMethodName] = async function (txn) {
            // if transaction is provided, leverage create hook instead
            if (txn)
                return;
            const query = dreamClass.query();
            await (0, afterSortableCreate_1.default)({
                dream: this,
                positionField,
                query,
                scope: opts.scope,
            });
        };
        dreamClass.prototype[afterDestroyMethodName] = async function (txn) {
            // if no transaction is provided, leverage destroy commit hook instead
            if (!txn)
                return;
            const query = dreamClass.query().txn(txn);
            await (0, afterSortableDestroy_1.default)({
                dream: this,
                positionField,
                query,
                scope: opts.scope,
            });
        };
        dreamClass.prototype[afterDestroyCommitMethodName] = async function (txn) {
            // if transaction is provided, leverage destroy hook instead
            if (txn)
                return;
            const query = dreamClass.query();
            await (0, afterSortableDestroy_1.default)({
                dream: this,
                positionField,
                query,
                scope: opts.scope,
            });
        };
        (0, before_save_1.default)()(target, beforeSaveMethodName);
        (0, after_create_1.default)()(target, afterCreateMethodName);
        (0, after_create_commit_1.default)()(target, afterCreateCommitMethodName);
        (0, after_update_1.default)()(target, afterUpdateMethodName);
        (0, after_update_commit_1.default)()(target, afterUpdateCommitMethodName);
        (0, after_destroy_1.default)()(target, afterDestroyMethodName);
        (0, after_destroy_commit_1.default)()(target, afterDestroyCommitMethodName);
    };
}
exports.default = Sortable;
