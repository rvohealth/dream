"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_application_1 = __importDefault(require("../../dream-application"));
const types_1 = require("../../dream/types");
function primaryKeyType() {
    const dreamconf = dream_application_1.default.getOrFail();
    switch (dreamconf.primaryKeyType) {
        case 'bigint':
        case 'bigserial':
        case 'uuid':
        case 'integer':
            return dreamconf.primaryKeyType;
        default:
            throw new Error(`
ATTENTION!

  unrecognized primary key type "${dreamconf.primaryKeyType}" found in .dream.yml.
  please use one of the allowed primary key types:
    ${types_1.primaryKeyTypes.join(', ')}
      `);
    }
}
exports.default = primaryKeyType;
