"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stringCasing_1 = __importDefault(require("./stringCasing"));
const snakeify_1 = require("./snakeify");
function hyphenize(target) {
    return (0, stringCasing_1.default)(target, hyphenizeString);
}
exports.default = hyphenize;
function hyphenizeString(str) {
    return (0, snakeify_1.snakeifyString)(str).replace(/_/g, '-');
}
