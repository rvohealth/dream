"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const missing_deleted_at_field_for_soft_delete_1 = __importDefault(require("../../exceptions/missing-deleted-at-field-for-soft-delete"));
const isDateTimeColumn_1 = __importDefault(require("../../helpers/db/types/isDateTimeColumn"));
async function softDeleteDream(dream, txn) {
    const deletedAtField = dream.deletedAtField;
    const dreamClass = dream.constructor;
    if (!(0, isDateTimeColumn_1.default)(dreamClass, deletedAtField)) {
        throw new missing_deleted_at_field_for_soft_delete_1.default(dream.constructor);
    }
    let query = txn.kyselyTransaction
        .updateTable(dream.table)
        .where(dream.primaryKey, '=', dream.primaryKeyValue)
        .set(dream.deletedAtField, luxon_1.DateTime.now());
    dreamClass['sortableFields']?.forEach(sortableFieldMetadata => {
        const positionColumn = sortableFieldMetadata.positionField;
        query = query.set(positionColumn, null);
    });
    await query.execute();
}
exports.default = softDeleteDream;
