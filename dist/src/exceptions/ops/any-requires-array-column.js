"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AnyRequiresArrayColumn extends Error {
    constructor(dreamClass, column) {
        super();
        this.dreamClass = dreamClass;
        this.column = column;
    }
    get message() {
        return `
Attempting to call where({ ${this.column}: ops.any(<some value>)} ),
but ${this.dreamClass.name}#${this.column} is not an array in the database.
`;
    }
}
exports.default = AnyRequiresArrayColumn;
