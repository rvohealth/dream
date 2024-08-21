"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function getFiles(dir) {
    try {
        const dirents = await promises_1.default.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(dirents.map(dirent => {
            const res = path_1.default.resolve(dir, dirent.name);
            return dirent.isDirectory() ? getFiles(res) : res;
        }));
        return Array.prototype.concat(...files);
    }
    catch (err) {
        if (err.code === 'ENOENT')
            return [];
        throw err;
    }
}
exports.default = getFiles;
