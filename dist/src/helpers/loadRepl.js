"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./loadEnv");
const luxon_1 = require("luxon");
const dream_application_1 = __importDefault(require("../dream-application"));
async function loadRepl(context) {
    const dreamApp = dream_application_1.default.getOrFail();
    await dreamApp.inflections?.();
    context.DateTime = luxon_1.DateTime;
    for (const globalName of Object.keys(dreamApp.models)) {
        context[globalName] = dreamApp.models[globalName];
    }
    for (const globalName of Object.keys(dreamApp.services)) {
        if (!context[globalName]) {
            context[globalName] = dreamApp.services[globalName];
        }
    }
}
exports.default = loadRepl;
