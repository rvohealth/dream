"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const standardizeFullyQualifiedModelName_1 = __importDefault(require("./standardizeFullyQualifiedModelName"));
function default_1(str) {
    return (0, standardizeFullyQualifiedModelName_1.default)(str).replace(/\//g, '');
}
exports.default = default_1;
