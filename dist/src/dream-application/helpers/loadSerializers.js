"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSerializersOrBlank = exports.getSerializersOrFail = exports.setCachedSerializers = void 0;
const serializer_name_conflict_1 = __importDefault(require("../../exceptions/dream-application/serializer-name-conflict"));
const getFiles_1 = __importDefault(require("../../helpers/getFiles"));
const globalSerializerKeyFromPath_1 = __importDefault(require("./globalSerializerKeyFromPath"));
let _serializers;
async function loadSerializers(serializersPath) {
    if (_serializers)
        return _serializers;
    _serializers = {};
    const serializerPaths = (await (0, getFiles_1.default)(serializersPath)).filter(path => /\.[jt]s$/.test(path));
    for (const serializerPath of serializerPaths) {
        const allSerializers = await Promise.resolve(`${serializerPath}`).then(s => __importStar(require(s)));
        Object.keys(allSerializers).forEach(key => {
            const potentialSerializer = allSerializers[key];
            if (potentialSerializer?.isDreamSerializer) {
                const serializerKey = (0, globalSerializerKeyFromPath_1.default)(serializerPath, serializersPath, key);
                if (_serializers[serializerKey])
                    throw new serializer_name_conflict_1.default(serializerKey);
                const serializer = potentialSerializer;
                serializer['setGlobalName'](serializerKey);
                _serializers[serializerKey] = potentialSerializer;
            }
        });
    }
    return _serializers;
}
exports.default = loadSerializers;
function setCachedSerializers(serializers) {
    _serializers = serializers;
}
exports.setCachedSerializers = setCachedSerializers;
function getSerializersOrFail() {
    if (!_serializers)
        throw new Error('Must call loadSerializers before calling getSerializersOrFail');
    return _serializers;
}
exports.getSerializersOrFail = getSerializersOrFail;
function getSerializersOrBlank() {
    return _serializers || {};
}
exports.getSerializersOrBlank = getSerializersOrBlank;
