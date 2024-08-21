"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MissingRequiredAssociationWhereClause extends Error {
    constructor(association, column) {
        super();
        this.association = association;
        this.column = column;
    }
    get message() {
        return `
Missing required association where clause:
Association: ${this.association.as}
Missing where clause for column: ${this.column}
`;
    }
}
exports.default = MissingRequiredAssociationWhereClause;
