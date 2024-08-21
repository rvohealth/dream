"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const dreamFileAndDirPaths_1 = __importDefault(require("../path/dreamFileAndDirPaths"));
const dreamPath_1 = __importDefault(require("../path/dreamPath"));
const standardizeFullyQualifiedModelName_1 = __importDefault(require("../standardizeFullyQualifiedModelName"));
const generateDreamContent_1 = __importDefault(require("./generateDreamContent"));
const generateFactory_1 = __importDefault(require("./generateFactory"));
const generateMigration_1 = __importDefault(require("./generateMigration"));
const generateSerializer_1 = __importDefault(require("./generateSerializer"));
const generateUnitSpec_1 = __importDefault(require("./generateUnitSpec"));
async function generateDream(fullyQualifiedModelName, attributes, parentName) {
    fullyQualifiedModelName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    const { relFilePath, absDirPath, absFilePath } = (0, dreamFileAndDirPaths_1.default)((0, dreamPath_1.default)('models'), `${fullyQualifiedModelName}.ts`);
    try {
        console.log(`generating dream: ${relFilePath}`);
        await promises_1.default.mkdir(absDirPath, { recursive: true });
        await promises_1.default.writeFile(absFilePath, (0, generateDreamContent_1.default)(fullyQualifiedModelName, attributes, parentName));
    }
    catch (error) {
        throw new Error(`
      Something happened while trying to create the Dream file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${error.message}
    `);
    }
    await (0, generateUnitSpec_1.default)(fullyQualifiedModelName);
    await (0, generateFactory_1.default)(fullyQualifiedModelName, attributes);
    await (0, generateSerializer_1.default)(fullyQualifiedModelName, attributes, parentName);
    const isSTI = !!parentName;
    if (attributes.length || !isSTI) {
        await (0, generateMigration_1.default)(fullyQualifiedModelName, attributes, parentName);
    }
}
exports.default = generateDream;
