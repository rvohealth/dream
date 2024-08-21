"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InvalidTableName extends Error {
    constructor(schema, tableName) {
        super();
        this.schema = schema;
        this.tableName = tableName;
    }
    get message() {
        const keys = Object.keys(this.schema);
        return `
Invalid table name passed to an underlying sql function.
The invalid table name received was:
  ${this.tableName}

Please make sure to only pass a valid table name. Valid table names are:
  ${keys.join(',\n        ')}
    `;
    }
}
exports.default = InvalidTableName;
