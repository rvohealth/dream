"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pascalize_1 = __importDefault(require("./pascalize"));
function default_1(str) {
    return str
        .split('/')
        .map(part => (0, pascalize_1.default)(part))
        .join('/');
}
exports.default = default_1;
