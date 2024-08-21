"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AttemptingToMarshalInvalidArrayType extends Error {
    constructor(given) {
        super();
        this.given = given;
    }
    get message() {
        return `
cannot properly interpret array value. Expecting value to match either
an array or a postgres-serialized array.

received:
  ${this.given?.constructor?.name}
  ${JSON.stringify(this.given)}
    `;
    }
}
exports.default = AttemptingToMarshalInvalidArrayType;
