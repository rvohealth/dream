"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cannot_reload_unsaved_dream_1 = __importDefault(require("../../exceptions/cannot-reload-unsaved-dream"));
const query_1 = __importDefault(require("../query"));
async function reload(dream, txn = null) {
    if (dream.isNewRecord)
        throw new cannot_reload_unsaved_dream_1.default(dream);
    let query = new query_1.default(dream);
    if (txn)
        query = query.txn(txn);
    query = query.removeAllDefaultScopes().where({ [dream.primaryKey]: dream.primaryKeyValue });
    const reloadedRecord = (await query.first());
    dream.setAttributes(reloadedRecord.getAttributes());
    dream['freezeAttributes']();
    return dream;
}
exports.default = reload;
