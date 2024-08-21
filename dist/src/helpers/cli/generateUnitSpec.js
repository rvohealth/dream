"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const dreamFileAndDirPaths_1 = __importDefault(require("../path/dreamFileAndDirPaths"));
const dreamPath_1 = __importDefault(require("../path/dreamPath"));
const standardizeFullyQualifiedModelName_1 = __importDefault(require("../standardizeFullyQualifiedModelName"));
const generateUnitSpecContent_1 = __importDefault(require("./generateUnitSpecContent"));
async function generateUnitSpec(fullyQualifiedModelName) {
    fullyQualifiedModelName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    const { relFilePath, absDirPath, absFilePath } = (0, dreamFileAndDirPaths_1.default)((0, dreamPath_1.default)('modelSpecs'), `${fullyQualifiedModelName}.spec.ts`);
    try {
        console.log(`generating spec: ${relFilePath}`);
        await promises_1.default.mkdir(absDirPath, { recursive: true });
        await promises_1.default.writeFile(absFilePath, (0, generateUnitSpecContent_1.default)(fullyQualifiedModelName));
    }
    catch (error) {
        throw new Error(`
      Something happened while trying to create the spec file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${error.message}
    `);
    }
}
exports.default = generateUnitSpec;
