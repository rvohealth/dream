"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
async function dropConstraint(constraintName, tableName, db) {
    await (0, kysely_1.sql) `
    ALTER TABLE ${kysely_1.sql.table(tableName)} DROP CONSTRAINT IF EXISTS ${kysely_1.sql.table(constraintName)};
  `.execute(db);
}
exports.default = dropConstraint;
