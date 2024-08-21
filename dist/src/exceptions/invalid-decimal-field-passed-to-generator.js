"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InvalidDecimalFieldPassedToGenerator extends Error {
    constructor(attribute) {
        super();
        this.attribute = attribute;
    }
    get message() {
        return `
must pass scale and precision after decimal, like so:
  ${this.attribute.split(':')[0]}:decimal:4,2

received:
  ${this.attribute}
    `;
    }
}
exports.default = InvalidDecimalFieldPassedToGenerator;
