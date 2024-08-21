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
exports.getServicesOrBlank = exports.getServicesOrFail = exports.setCachedServices = void 0;
const getFiles_1 = __importDefault(require("../../helpers/getFiles"));
const globalServiceKeyFromPath_1 = __importDefault(require("./globalServiceKeyFromPath"));
let _services;
async function loadServices(servicesPath) {
    if (_services)
        return _services;
    _services = {};
    const servicePaths = (await (0, getFiles_1.default)(servicesPath)).filter(path => /\.[jt]s$/.test(path));
    for (const servicePath of servicePaths) {
        const serviceClass = (await Promise.resolve(`${servicePath}`).then(s => __importStar(require(s)))).default;
        // we only want to register services within our app
        // that are backgroundable, since the only purpose
        // for keeping these indices is to be able to summon
        // a service for backgrounding.
        if (typeof serviceClass?.background === 'function' || typeof serviceClass?.schedule === 'function') {
            const serviceKey = (0, globalServiceKeyFromPath_1.default)(servicePath, servicesPath);
            if (typeof serviceClass['setGlobalName'] === 'function') {
                serviceClass['setGlobalName'](serviceKey);
            }
            else {
                serviceClass.globalName = serviceKey;
            }
            _services[serviceKey] = serviceClass;
        }
    }
    return _services;
}
exports.default = loadServices;
function setCachedServices(services) {
    _services = services;
}
exports.setCachedServices = setCachedServices;
function getServicesOrFail() {
    if (!_services)
        throw new Error('Must call loadServices before calling getServicesOrFail');
    return _services;
}
exports.getServicesOrFail = getServicesOrFail;
function getServicesOrBlank() {
    return _services || {};
}
exports.getServicesOrBlank = getServicesOrBlank;
