"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invalid_table_name_1 = __importDefault(require("../../exceptions/invalid-table-name"));
function validateTable(schema, tableName) {
    if (!Object.prototype.hasOwnProperty.call(schema, tableName))
        throw new invalid_table_name_1.default(schema, tableName);
    return tableName;
}
exports.default = validateTable;
