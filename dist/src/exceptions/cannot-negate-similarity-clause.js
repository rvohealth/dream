"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotNegateSimilarityClause extends Error {
    constructor(tableName, columnName, value) {
        super();
        this.tableName = tableName;
        this.columnName = columnName;
        this.value = value;
    }
    get message() {
        return `
Negating similarity expressions is not supported.
  table: ${this.tableName}
  column: ${this.columnName}
  value passed to similarity clause: ${this.value}
    `;
    }
}
exports.default = CannotNegateSimilarityClause;
