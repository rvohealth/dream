"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../../helpers/loadEnv");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const connection_conf_retriever_primitive_1 = __importDefault(require("../../../boot/cli/connection-conf-retriever-primitive"));
const dream_application_1 = __importDefault(require("../../dream-application"));
const compact_1 = __importDefault(require("../../helpers/compact"));
const dreamPath_1 = __importDefault(require("../../helpers/path/dreamPath"));
const snakeify_1 = __importDefault(require("../../helpers/snakeify"));
const sspawn_1 = __importDefault(require("../../helpers/sspawn"));
async function writeSyncFile() {
    const dbConf = new connection_conf_retriever_primitive_1.default().getConnectionConf('primary');
    const dreamApp = dream_application_1.default.getOrFail();
    const dbSyncFilePath = path_1.default.join((0, dreamPath_1.default)('db'), 'sync.ts');
    const absoluteDbSyncPath = path_1.default.join(dreamApp.projectRoot, dbSyncFilePath);
    await (0, sspawn_1.default)(`kysely-codegen --url=postgres://${dbConf.user}:${dbConf.password}@${dbConf.host}:${dbConf.port}/${dbConf.name} --out-file=${absoluteDbSyncPath}`);
    // intentionally bypassing helpers here, since they often end up referencing
    // from the dist folder, whereas dirname here is pointing to true src folder.
    const file = (await promises_1.default.readFile(absoluteDbSyncPath)).toString();
    const enhancedSchema = enhanceSchema(file);
    await promises_1.default.writeFile(absoluteDbSyncPath, enhancedSchema);
    console.log('done writing dream sync file!');
}
exports.default = writeSyncFile;
// begin: schema helpers
function enhanceSchema(file) {
    file = removeUnwantedExports(file);
    file = replaceJsonType(file);
    const interfaces = file.split(/export interface /g);
    const results = interfaces.slice(1, interfaces.length);
    const dbInterface = results.find(str => /^DB \{/.test(str));
    const camelDbInterface = camelcasify(dbInterface);
    file = camelcasify(file);
    file = file.replace(camelDbInterface, dbInterface);
    file = addCustomImports(file);
    const transformedNames = (0, compact_1.default)(results.map(result => transformName(result)));
    const fileWithCoercedTypes = exportedTypesToExportedTypeValues(file);
    // BEGIN FILE CONTENTS BUILDING
    const newFileContents = `${fileWithCoercedTypes}

export class DBClass {
  ${transformedNames
        .map(name => `${(0, snakeify_1.default)(name)}: ${name}`)
        .sort()
        .join('\n  ')}
}
`;
    const sortedFileContents = alphaSortInterfaceProperties(newFileContents);
    return sortedFileContents;
}
function removeUnwantedExports(file) {
    return file.replace('\nexport type Timestamp = ColumnType<Date, Date | string, Date | string>;', `\
export type IdType = string | number | bigint
export type Timestamp = ColumnType<DateTime | CalendarDate>`);
}
function addCustomImports(file) {
    const calendarDateImportStatement = process.env.DREAM_CORE_DEVELOPMENT === '1'
        ? "import CalendarDate from '../../src/helpers/CalendarDate'"
        : "import { CalendarDate } from '@rvohealth/dream'";
    const customImports = `${calendarDateImportStatement}
import { DateTime } from 'luxon'`;
    return `${customImports}
${file}`;
}
function replaceJsonType(str) {
    return str.replace('export type Json = ColumnType<JsonValue, string, string>', 'export type Json = ColumnType<JsonValue, string | JsonValue, string | JsonValue>');
}
function camelcasify(str) {
    return _camelcasify(str);
}
function _camelcasify(str) {
    const camelString = str.replace(/([( .])([a-z][a-zA-Z0-9]*)_([a-z0-9])([a-z0-9]*)/g, (match, p1, p2, p3, p4) => `${p1}${p2}${p3.toUpperCase()}${p4}`);
    return camelString === str ? camelString : _camelcasify(camelString);
}
function alphaSortInterfaceProperties(str) {
    return str.replace(/(export interface [^\n{]+){\n([^}]+)\n}/g, (_match, interfaceDeclaration, lines) => {
        const props = lines.split(/\n/);
        return `${interfaceDeclaration}{
${props.sort().join('\n')}
}`;
    });
}
function exportedTypesToExportedTypeValues(str) {
    const ommitedTypes = [
        'Generated<T>',
        'Int8',
        'Numeric',
        'Json',
        'JsonArray',
        'JsonObject',
        'JsonPrimitive',
        'JsonValue',
    ];
    return str.replace(/export type ([^=]*) = ([^;\n]*);/g, (_match, typeDeclaration, types) => {
        const originalType = `export type ${typeDeclaration} = ${types};`;
        if (ommitedTypes.some(type => type === typeDeclaration)) {
            return originalType;
        }
        return `\
${originalType}
export const ${typeDeclaration}Values = [
  ${types.split(' | ').join(',\n  ')}
] as const
`;
    });
}
function transformName(str) {
    const name = str.split(' {')[0].replace(/\s/g, '');
    if (name === 'DB')
        return null;
    return name;
}
