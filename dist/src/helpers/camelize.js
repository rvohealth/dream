"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelizeString = void 0;
const stringCasing_1 = __importDefault(require("./stringCasing"));
const uncapitalize_1 = __importDefault(require("./uncapitalize"));
function camelize(target) {
    return (0, stringCasing_1.default)(target, camelizeString);
}
exports.default = camelize;
function camelizeString(str) {
    return (0, uncapitalize_1.default)(str
        .replace(/[_-]+/g, '_')
        .replace(/(^_|_$)/g, '')
        .replace(/_(.)/g, (_, x) => x.toUpperCase()));
}
exports.camelizeString = camelizeString;
