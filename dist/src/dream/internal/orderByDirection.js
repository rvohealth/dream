"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
function orderByDirection(dir) {
    switch (dir) {
        case 'asc':
        case null:
            return (0, kysely_1.sql) `asc nulls last`;
        case 'desc':
            return (0, kysely_1.sql) `desc nulls last`;
        default:
            throw new Error(`Unrecognized orderBy direction: ${dir}`);
    }
}
exports.default = orderByDirection;
