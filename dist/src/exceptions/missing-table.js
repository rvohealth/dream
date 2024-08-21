"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pluralize_1 = __importDefault(require("pluralize"));
const snakeify_1 = __importDefault(require("../helpers/snakeify"));
class MissingTable extends Error {
    constructor(dreamClass) {
        super();
        this.dreamClass = dreamClass;
    }
    get message() {
        return `
Missing table definition on the following dream class:
Dream class: ${this.dreamClass.name}

Try something like this in your ${this.dreamClass.name}'s table getter:

class ${this.dreamClass.name} {
  ...
  public get table() {
    return '${(0, pluralize_1.default)((0, snakeify_1.default)(this.dreamClass.name))}'
  }
}
    `;
    }
}
exports.default = MissingTable;
