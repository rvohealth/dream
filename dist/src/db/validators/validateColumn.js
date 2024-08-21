"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invalid_column_name_1 = __importDefault(require("../../exceptions/invalid-column-name"));
function validateColumn(schema, tableName, columnName) {
    if (!Object.prototype.hasOwnProperty.call(schema, tableName))
        throw new invalid_column_name_1.default(tableName, columnName);
    if (!Object.prototype.hasOwnProperty.call(schema[tableName]?.columns, columnName))
        throw new invalid_column_name_1.default(tableName, columnName);
    return columnName;
}
exports.default = validateColumn;
