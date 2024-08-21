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
exports.getModelsOrBlank = exports.getModelsOrFail = exports.setCachedModels = void 0;
const getFiles_1 = __importDefault(require("../../helpers/getFiles"));
const globalModelKeyFromPath_1 = __importDefault(require("./globalModelKeyFromPath"));
let _models;
async function loadModels(modelsPath) {
    if (_models)
        return _models;
    _models = {};
    const modelPaths = (await (0, getFiles_1.default)(modelsPath)).filter(path => /\.[jt]s$/.test(path));
    for (const modelPath of modelPaths) {
        const modelClass = (await Promise.resolve(`${modelPath}`).then(s => __importStar(require(s)))).default;
        if (modelClass.isDream) {
            try {
                // Don't create a global lookup for ApplicationModel
                // ApplicationModel does not have a table
                if (modelClass.table) {
                    const modelKey = (0, globalModelKeyFromPath_1.default)(modelPath, modelsPath);
                    modelClass['setGlobalName'](modelKey);
                    _models[modelKey] = modelClass;
                }
            }
            catch {
                // ApplicationModel will automatically raise an exception here,
                // since it does not have a table.
            }
        }
    }
    return _models;
}
exports.default = loadModels;
function setCachedModels(models) {
    _models = models;
}
exports.setCachedModels = setCachedModels;
function getModelsOrFail() {
    if (!_models)
        throw new Error('Must call loadModels before calling getModelsOrFail');
    return _models;
}
exports.getModelsOrFail = getModelsOrFail;
function getModelsOrBlank() {
    return _models || {};
}
exports.getModelsOrBlank = getModelsOrBlank;
