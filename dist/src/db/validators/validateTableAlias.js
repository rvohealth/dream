"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invalid_table_alias_1 = __importDefault(require("../../exceptions/invalid-table-alias"));
function validateTableAlias(tableAlias) {
    if (!/^[a-zA-Z0-9_]*$/.test(tableAlias) || SINGLE_WORD_SQL_KEYWORDS.includes(tableAlias.toUpperCase()))
        throw new invalid_table_alias_1.default(tableAlias);
    return tableAlias;
}
exports.default = validateTableAlias;
const SINGLE_WORD_SQL_KEYWORDS = [
    'ADD',
    'ALL',
    'ALTER',
    'AND',
    'ANY',
    'AS',
    'ASC',
    'BACKUP',
    'BETWEEN',
    'CASE',
    'CHECK',
    'COLUMN',
    'CONSTRAINT',
    'CREATE',
    'DATABASE',
    'DEFAULT',
    'DELETE',
    'DESC',
    'DISTINCT',
    'DROP',
    'EXEC',
    'EXISTS',
    'FROM',
    'HAVING',
    'IN',
    'INDEX',
    'JOIN',
    'LIKE',
    'LIMIT',
    'NOT',
    'OR',
    'PROCEDURE',
    'ROWNUM',
    'SELECT',
    'SET',
    'TABLE',
    'TOP',
    'TRUNCATE',
    'UNION',
    'UNIQUE',
    'UPDATE',
    'VALUES',
    'VIEW',
    'WHERE',
];
