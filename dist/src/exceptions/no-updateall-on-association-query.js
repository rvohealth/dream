"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NoUpdateAllOnAssociationQuery extends Error {
    get message() {
        return `
udpateAll may not be called on an associationQuery. Use associationUpdateQuery instead
    `;
    }
}
exports.default = NoUpdateAllOnAssociationQuery;
