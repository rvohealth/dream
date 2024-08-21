"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stringCasing_1 = __importDefault(require("./stringCasing"));
const camelize_1 = require("./camelize");
const capitalize_1 = __importDefault(require("./capitalize"));
function pascalize(target) {
    return (0, stringCasing_1.default)(target, pascalizeString);
}
exports.default = pascalize;
function pascalizeString(str) {
    return (0, capitalize_1.default)((0, camelize_1.camelizeString)(str));
}
