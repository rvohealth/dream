"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const installCoreDreamDependenciesToDir_1 = __importDefault(require("./installCoreDreamDependenciesToDir"));
async function newDreamApp(appName, args) {
    const projectPath = `./${appName}`;
    await promises_1.default.mkdir(projectPath);
    await (0, installCoreDreamDependenciesToDir_1.default)(appName, projectPath, args);
}
exports.default = newDreamApp;
