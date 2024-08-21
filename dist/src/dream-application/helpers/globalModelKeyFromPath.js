"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(filepath, dirPath) {
    const prefixPath = dirPath;
    return filepath
        .replace(prefixPath, '')
        .replace(/\.[jt]s$/, '')
        .replace(/^\//, '');
}
exports.default = default_1;
