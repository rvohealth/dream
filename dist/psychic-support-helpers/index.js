"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardizeFullyQualifiedModelName = exports.serializerNameFromFullyQualifiedModelName = exports.sharedPathPrefix = exports.relativeDreamPath = exports.globalClassNameFromFullyQualifiedModelName = void 0;
var globalClassNameFromFullyQualifiedModelName_1 = require("../src/helpers/globalClassNameFromFullyQualifiedModelName");
Object.defineProperty(exports, "globalClassNameFromFullyQualifiedModelName", { enumerable: true, get: function () { return __importDefault(globalClassNameFromFullyQualifiedModelName_1).default; } });
var relativeDreamPath_1 = require("../src/helpers/path/relativeDreamPath");
Object.defineProperty(exports, "relativeDreamPath", { enumerable: true, get: function () { return __importDefault(relativeDreamPath_1).default; } });
var sharedPathPrefix_1 = require("../src/helpers/path/sharedPathPrefix");
Object.defineProperty(exports, "sharedPathPrefix", { enumerable: true, get: function () { return __importDefault(sharedPathPrefix_1).default; } });
var serializerNameFromFullyQualifiedModelName_1 = require("../src/helpers/serializerNameFromFullyQualifiedModelName");
Object.defineProperty(exports, "serializerNameFromFullyQualifiedModelName", { enumerable: true, get: function () { return __importDefault(serializerNameFromFullyQualifiedModelName_1).default; } });
var standardizeFullyQualifiedModelName_1 = require("../src/helpers/standardizeFullyQualifiedModelName");
Object.defineProperty(exports, "standardizeFullyQualifiedModelName", { enumerable: true, get: function () { return __importDefault(standardizeFullyQualifiedModelName_1).default; } });
