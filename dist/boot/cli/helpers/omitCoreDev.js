"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function omitCoreDev(programArgs) {
    return programArgs.filter(arg => arg !== '--core');
}
exports.default = omitCoreDev;
