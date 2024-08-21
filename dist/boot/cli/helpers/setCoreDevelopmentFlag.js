"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreSuffix = void 0;
function setCoreDevelopmentFlag(programArgs) {
    if (programArgs.includes('--core')) {
        process.env.DREAM_CORE_DEVELOPMENT = '1';
        return 'DREAM_CORE_DEVELOPMENT=1 ';
    }
    else {
        return '';
    }
}
exports.default = setCoreDevelopmentFlag;
function coreSuffix(programArgs) {
    return programArgs.includes('--core') ? ' --core' : '';
}
exports.coreSuffix = coreSuffix;
