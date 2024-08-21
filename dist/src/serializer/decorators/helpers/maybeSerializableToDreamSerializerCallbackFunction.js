"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hasSerializersGetter_1 = __importDefault(require("./hasSerializersGetter"));
function default_1(dreamOrSerializerClass) {
    if (dreamOrSerializerClass === null)
        return null;
    if (Array.isArray(dreamOrSerializerClass))
        return null;
    if (dreamOrSerializerClass.isDream)
        return null;
    if ((0, hasSerializersGetter_1.default)(dreamOrSerializerClass))
        return null;
    // this must not call the function because this function is called as part of decorator
    // execution, which happens at file load time and creates circular dependencies if the
    // class is referenced directly during file load
    if (dreamOrSerializerClass instanceof Function)
        return dreamOrSerializerClass;
    return null;
}
exports.default = default_1;
