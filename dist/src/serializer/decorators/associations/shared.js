"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSerializable = void 0;
const hasSerializersGetter_1 = __importDefault(require("../helpers/hasSerializersGetter"));
const maybeSerializableToDreamSerializerCallbackFunction_1 = __importDefault(require("../helpers/maybeSerializableToDreamSerializerCallbackFunction"));
function isSerializable(dreamOrSerializerClass) {
    return (Array.isArray(dreamOrSerializerClass) ||
        (0, hasSerializersGetter_1.default)(dreamOrSerializerClass) ||
        !!(0, maybeSerializableToDreamSerializerCallbackFunction_1.default)(dreamOrSerializerClass));
}
exports.isSerializable = isSerializable;
