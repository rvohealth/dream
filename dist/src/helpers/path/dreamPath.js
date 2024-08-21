"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dream_application_1 = __importDefault(require("../../dream-application"));
function default_1(dreamPathType) {
    const dreamApp = dream_application_1.default.getOrFail();
    switch (dreamPathType) {
        case 'models':
            return dreamApp.paths.models;
        case 'serializers':
            return dreamApp.paths.serializers;
        case 'db':
            return dreamApp.paths.db;
        case 'conf':
            return dreamApp.paths.conf;
        case 'modelSpecs':
            return dreamApp.paths.modelSpecs;
        case 'factories':
            return dreamApp.paths.factories;
    }
}
exports.default = default_1;
