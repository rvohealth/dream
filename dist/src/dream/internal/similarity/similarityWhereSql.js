"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
const validateTable_1 = __importDefault(require("../../../db/validators/validateTable"));
const validateColumn_1 = __importDefault(require("../../../db/validators/validateColumn"));
function similarityWhereSql({ eb, tableName, columnName, opsStatement, schema, }) {
    let functionName = 'similarity';
    switch (opsStatement.operator) {
        case '<%':
            functionName = 'word_similarity';
            break;
        case '<<%':
            functionName = 'strict_word_similarity';
            break;
    }
    return (0, kysely_1.sql) `(${kysely_1.sql.raw(functionName)}(
      ${opsStatement.value}::text,
      (coalesce(${eb.ref((0, validateTable_1.default)(schema, tableName))}.${eb.ref((0, validateColumn_1.default)(schema, tableName, columnName))} :: text, ''))
    ) >= ${opsStatement.minTrigramScore})`;
}
exports.default = similarityWhereSql;
