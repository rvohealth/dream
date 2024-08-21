"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MissingRequiredPassthroughForAssociationWhereClause extends Error {
    constructor(column) {
        super();
        this.column = column;
    }
    get message() {
        return `
Missing passthrough for association where clause:
Missing passthrough where clause for column: ${this.column}
`;
    }
}
exports.default = MissingRequiredPassthroughForAssociationWhereClause;
