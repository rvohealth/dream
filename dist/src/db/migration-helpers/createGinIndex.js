"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
async function createGinIndex(tableName, column, indexName, db) {
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS ${kysely_1.sql.raw(indexName)} ON ${kysely_1.sql.raw(tableName)} USING GIN (${kysely_1.sql.raw(`${column} gin_trgm_ops`)});
  `.execute(db);
}
exports.default = createGinIndex;
