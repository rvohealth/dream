"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(filepath, dirPath, exportKey = 'default') {
    const prefixPath = dirPath;
    const defaultExport = filepath
        .replace(prefixPath, '')
        .replace(/\.[jt]s$/, '')
        .replace(/^\//, '');
    if (exportKey === 'default') {
        return defaultExport;
    }
    else {
        const namePrefixFromPath = defaultExport.replace(/[^/]+\/?$/, '');
        return namePrefixFromPath + exportKey.replace(new RegExp(`^${namePrefixFromPath.replace(/\/$/, '')}`), '');
    }
}
exports.default = default_1;
