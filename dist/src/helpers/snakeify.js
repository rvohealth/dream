"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.snakeifyString = void 0;
const stringCasing_1 = __importDefault(require("./stringCasing"));
const camelize_1 = require("./camelize");
function snakeify(target) {
    return (0, stringCasing_1.default)(target, snakeifyString);
}
exports.default = snakeify;
function snakeifyString(str) {
    return (0, camelize_1.camelizeString)(str)
        .replace(/([,./<>?;':"[\]{}\\|!@#$%^&*()`])([A-Z])/g, (_, x, y) => x + y.toLowerCase())
        .replace(/([A-Z])/g, (_, y) => '_' + y.toLowerCase());
}
exports.snakeifyString = snakeifyString;
