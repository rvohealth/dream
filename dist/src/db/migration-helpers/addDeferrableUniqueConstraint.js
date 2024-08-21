"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
const dropConstraint_1 = __importDefault(require("./dropConstraint"));
async function addDeferrableUniqueConstraint(constraintName, tableName, columns, db) {
    await (0, dropConstraint_1.default)(constraintName, tableName, db);
    await (0, kysely_1.sql) `
    ALTER TABLE ${kysely_1.sql.table(tableName)}
    ADD CONSTRAINT ${kysely_1.sql.table(constraintName)}
      UNIQUE (${kysely_1.sql.raw(columns.join(', '))})
      DEFERRABLE INITIALLY DEFERRED;
  `.execute(db);
}
exports.default = addDeferrableUniqueConstraint;
