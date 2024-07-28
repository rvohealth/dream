"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const installCoreDreamDependenciesToDir_1 = __importDefault(require("./installCoreDreamDependenciesToDir"));
async function initDreamApp(args) {
    await (0, installCoreDreamDependenciesToDir_1.default)('dream app', '.', args);
}
exports.default = initDreamApp;
