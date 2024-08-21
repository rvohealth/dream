"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pascalize_1 = __importDefault(require("./pascalize"));
function pascalizePath(path) {
    return path
        .split('/')
        .map(namePart => (0, pascalize_1.default)(namePart))
        .join('');
}
exports.default = pascalizePath;
