"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
const validateColumn_1 = __importDefault(require("../../../db/validators/validateColumn"));
const validateTable_1 = __importDefault(require("../../../db/validators/validateTable"));
function similaritySelectSql({ eb, tableName, columnName, opsStatement, schema, rankSQLAlias, }) {
    return (0, kysely_1.sql) `
  (
    ts_rank(
      (
        to_tsvector(
          'simple',
          coalesce(${eb.ref((0, validateTable_1.default)(schema, tableName))}.${eb.ref((0, validateColumn_1.default)(schema, tableName, columnName))} :: text, '')
        )
      ),
      (websearch_to_tsquery('simple', ''' ' || ${opsStatement.value}::text || ' ''')),
      0
    )
  )`.as(eb.ref(rankSQLAlias));
}
exports.default = similaritySelectSql;
