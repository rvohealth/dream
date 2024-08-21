"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generateMigrationContent_1 = __importDefault(require("./generateMigrationContent"));
function generateStiMigrationContent({ table, attributes = [], primaryKeyType = 'bigserial', } = {}) {
    return (0, generateMigrationContent_1.default)({ table, attributes, primaryKeyType, createOrAlter: 'alter' });
}
exports.default = generateStiMigrationContent;
