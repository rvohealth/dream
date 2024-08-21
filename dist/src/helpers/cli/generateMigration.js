"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pluralize_1 = __importDefault(require("pluralize"));
const generateMigrationContent_1 = __importDefault(require("../cli/generateMigrationContent"));
const primaryKeyType_1 = __importDefault(require("../db/primaryKeyType"));
const hyphenize_1 = __importDefault(require("../hyphenize"));
const migrationVersion_1 = __importDefault(require("../migrationVersion"));
const pascalizePath_1 = __importDefault(require("../pascalizePath"));
const dreamFileAndDirPaths_1 = __importDefault(require("../path/dreamFileAndDirPaths"));
const dreamPath_1 = __importDefault(require("../path/dreamPath"));
const snakeify_1 = __importDefault(require("../snakeify"));
const generateStiMigrationContent_1 = __importDefault(require("./generateStiMigrationContent"));
async function generateMigration(fullyQualifiedModelName, attributes, parentName) {
    const { relFilePath, absFilePath } = (0, dreamFileAndDirPaths_1.default)(path_1.default.join((0, dreamPath_1.default)('db'), 'migrations'), `${(0, migrationVersion_1.default)()}-${(0, hyphenize_1.default)(fullyQualifiedModelName).replace(/\//g, '-')}.ts`);
    const isSTI = !!parentName;
    let finalContent = '';
    if (isSTI) {
        finalContent = (0, generateStiMigrationContent_1.default)({
            table: (0, snakeify_1.default)((0, pluralize_1.default)((0, pascalizePath_1.default)(parentName))),
            attributes,
            primaryKeyType: (0, primaryKeyType_1.default)(),
        });
    }
    else if (fullyQualifiedModelName) {
        finalContent = (0, generateMigrationContent_1.default)({
            table: (0, snakeify_1.default)((0, pluralize_1.default)((0, pascalizePath_1.default)(fullyQualifiedModelName))),
            attributes,
            primaryKeyType: (0, primaryKeyType_1.default)(),
        });
    }
    try {
        console.log(`generating migration: ${relFilePath}`);
        await promises_1.default.writeFile(absFilePath, finalContent);
    }
    catch (error) {
        throw new Error(`
      Something happened while trying to create the migration file:
        ${relFilePath}

      Does this file already exist? Here is the error that was raised:
        ${error.message}
    `);
    }
}
exports.default = generateMigration;
