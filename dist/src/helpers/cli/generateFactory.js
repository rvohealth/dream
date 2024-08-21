"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const dreamFileAndDirPaths_1 = __importDefault(require("../path/dreamFileAndDirPaths"));
const dreamPath_1 = __importDefault(require("../path/dreamPath"));
const standardizeFullyQualifiedModelName_1 = __importDefault(require("../standardizeFullyQualifiedModelName"));
const generateFactoryContent_1 = __importDefault(require("./generateFactoryContent"));
async function generateFactory(fullyQualifiedModelName, attributes) {
    fullyQualifiedModelName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    const { relFilePath, absDirPath, absFilePath } = (0, dreamFileAndDirPaths_1.default)((0, dreamPath_1.default)('factories'), `${fullyQualifiedModelName}Factory.ts`);
    try {
        console.log(`generating factory: ${relFilePath}`);
        await promises_1.default.mkdir(absDirPath, { recursive: true });
        await promises_1.default.writeFile(absFilePath, (0, generateFactoryContent_1.default)(fullyQualifiedModelName, attributes));
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
exports.default = generateFactory;
