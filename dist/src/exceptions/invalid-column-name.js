"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InvalidColumnName extends Error {
    constructor(tableName, columnName) {
        super();
        this.tableName = tableName;
        this.columnName = columnName;
    }
    get message() {
        return `
Invalid column name passed to an underlying sql function.
The invalid column name received was:
  ${this.tableName}.${this.columnName}
    `;
    }
}
exports.default = InvalidColumnName;
