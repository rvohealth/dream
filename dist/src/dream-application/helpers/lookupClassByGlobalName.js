"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loadModels_1 = require("./loadModels");
const loadSerializers_1 = require("./loadSerializers");
const loadServices_1 = require("./loadServices");
let _globalNameMap;
function lookupClassByGlobalName(globalName) {
    if (_globalNameMap)
        return _globalNameMap[globalName] || null;
    _globalNameMap = {
        ...(0, loadServices_1.getServicesOrFail)(),
        ...(0, loadSerializers_1.getSerializersOrFail)(),
        ...(0, loadModels_1.getModelsOrFail)(),
    };
    return lookupClassByGlobalName(globalName);
}
exports.default = lookupClassByGlobalName;
