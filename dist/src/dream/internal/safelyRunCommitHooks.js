"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runHooksFor_1 = __importDefault(require("./runHooksFor"));
async function safelyRunCommitHooks(dream, hookType, alreadyPersisted, beforeSaveChanges, txn = null) {
    const Base = dream.constructor;
    if (txn) {
        Base['hooks'][hookType].forEach(hook => {
            txn.addCommitHook(hook, dream);
        });
    }
    else {
        await (0, runHooksFor_1.default)(hookType, dream, alreadyPersisted, beforeSaveChanges);
    }
}
exports.default = safelyRunCommitHooks;
