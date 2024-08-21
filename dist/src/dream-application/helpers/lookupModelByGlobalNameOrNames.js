"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compact_1 = __importDefault(require("../../helpers/compact"));
const lookupModelByGlobalName_1 = __importDefault(require("./lookupModelByGlobalName"));
function lookupModelByGlobalNameOrNames(globalName) {
    if (Array.isArray(globalName))
        return (0, compact_1.default)(globalName.map(name => (0, lookupModelByGlobalName_1.default)(name)));
    return (0, lookupModelByGlobalName_1.default)(globalName);
}
exports.default = lookupModelByGlobalNameOrNames;
