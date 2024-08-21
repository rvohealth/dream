"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferSerializerFromDreamClassOrViewModelClass = void 0;
const dream_application_1 = __importDefault(require("../dream-application"));
function inferSerializerFromDreamOrViewModel(obj, serializerKey = undefined) {
    const globalName = obj?.['serializers']?.[serializerKey || 'default'] || null;
    if (globalName) {
        const dreamApp = dream_application_1.default.getOrFail();
        return dreamApp.serializers[globalName] || null;
    }
    return null;
}
exports.default = inferSerializerFromDreamOrViewModel;
function inferSerializerFromDreamClassOrViewModelClass(classDef, serializerKey = undefined) {
    return inferSerializerFromDreamOrViewModel(classDef.prototype, serializerKey);
}
exports.inferSerializerFromDreamClassOrViewModelClass = inferSerializerFromDreamClassOrViewModelClass;
