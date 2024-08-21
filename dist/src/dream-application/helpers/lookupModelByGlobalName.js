"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loadModels_1 = require("./loadModels");
let _globalNameMap;
function lookupModelByGlobalName(globalName) {
    if (_globalNameMap)
        return _globalNameMap[globalName] || null;
    _globalNameMap = {
        ...(0, loadModels_1.getModelsOrFail)(),
    };
    return lookupModelByGlobalName(globalName);
}
exports.default = lookupModelByGlobalName;
