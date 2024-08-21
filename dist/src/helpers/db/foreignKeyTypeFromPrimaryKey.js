"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function foreignKeyTypeFromPrimaryKey(primaryKey) {
    switch (primaryKey) {
        case 'bigserial':
            return 'bigint';
        default:
            return primaryKey;
    }
}
exports.default = foreignKeyTypeFromPrimaryKey;
