"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const kysely_1 = require("kysely");
const lodash_sortby_1 = __importDefault(require("lodash.sortby"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("../../db"));
const dataTypes_1 = require("../../db/dataTypes");
const dream_application_1 = __importDefault(require("../../dream-application"));
const types_1 = require("../../dream/types");
const failed_to_identify_association_1 = __importDefault(require("../../exceptions/schema-builder/failed-to-identify-association"));
const camelize_1 = __importDefault(require("../camelize"));
const pascalize_1 = __importDefault(require("../pascalize"));
const uniq_1 = __importDefault(require("../uniq"));
class SchemaBuilder {
    async build() {
        const { schemaConstContent, passthroughColumns, allDefaultScopeNames } = await this.buildSchemaContent();
        const imports = await this.getSchemaImports(schemaConstContent);
        const importStr = imports.length
            ? `\
import {
  ${imports.sort().join(',\n  ')}
} from './sync'`
            : '';
        const calendarDateImportStatement = process.env.DREAM_CORE_DEVELOPMENT === '1'
            ? "import CalendarDate from '../../src/helpers/CalendarDate'"
            : "import { CalendarDate } from '@rvohealth/dream'";
        const dreamApp = dream_application_1.default.getOrFail();
        const newSchemaFileContents = `\
${calendarDateImportStatement}
import { DateTime } from 'luxon'
${importStr}

${schemaConstContent}

export const globalSchema = {
  passthroughColumns: ${stringifyArray((0, uniq_1.default)(passthroughColumns.sort()), { indent: 4 })},
  allDefaultScopeNames: ${stringifyArray((0, uniq_1.default)(allDefaultScopeNames.sort()), { indent: 4 })},
  globalNames: {
    models: ${this.globalModelNames()},
    serializers: ${stringifyArray(Object.keys(dreamApp.serializers || {}).sort(), { indent: 6 })},
  },
} as const
`;
        // const newSchemaFileContents = `\
        // ${schemaConstContent}
        // `
        const schemaPath = path_1.default.join(dreamApp.projectRoot, dreamApp.paths.db, 'schema.ts');
        await promises_1.default.writeFile(schemaPath, newSchemaFileContents);
    }
    globalModelNames() {
        const dreamApp = dream_application_1.default.getOrFail();
        return `{
      ${Object.keys(dreamApp.models)
            .map(key => `'${key}': '${dreamApp.models[key].prototype.table}'`)
            .join(',\n      ')}
    }`;
    }
    async buildSchemaContent() {
        let passthroughColumns = [];
        let allDefaultScopeNames = [];
        const schemaData = await this.getSchemaData();
        const fileContents = await this.loadDbSyncFile();
        const schemaConstContent = `\
export const schema = {
  ${Object.keys(schemaData)
            .map(tableName => {
            const tableData = schemaData[tableName];
            const defaultScopeNames = tableData.scopes.default;
            const namedScopeNames = tableData.scopes.named;
            allDefaultScopeNames = [...allDefaultScopeNames, ...defaultScopeNames];
            return `\
${tableName}: {
    primaryKey: '${tableData.primaryKey}',
    createdAtField: '${tableData.createdAtField}',
    updatedAtField: '${tableData.updatedAtField}',
    deletedAtField: '${tableData.deletedAtField}',
    serializerKeys: ${stringifyArray(tableData.serializerKeys)},
    scopes: {
      default: ${stringifyArray(defaultScopeNames)},
      named: ${stringifyArray(namedScopeNames)},
    },
    columns: {
      ${Object.keys(schemaData[tableName].columns)
                .sort()
                .map(columnName => {
                const columnData = tableData.columns[columnName];
                const kyselyType = this.kyselyType(tableName, columnName, fileContents);
                return `${columnName}: {
        coercedType: {} as ${this.coercedType(kyselyType, columnData.dbType)},
        enumType: ${columnData.enumType ? `{} as ${columnData.enumType}` : 'null'},
        enumValues: ${columnData.enumValues ?? 'null'},
        dbType: '${columnData.dbType}',
        allowNull: ${columnData.allowNull},
        isArray: ${columnData.isArray},
      },`;
            })
                .join('\n      ')}
    },
    virtualColumns: ${stringifyArray(schemaData[tableName].virtualColumns)},
    associations: {
      ${Object.keys(schemaData[tableName].associations)
                .sort()
                .map(associationName => {
                const associationMetadata = tableData.associations[associationName];
                const whereStatement = associationMetadata.where;
                const requiredWhereClauses = whereStatement === null
                    ? []
                    : Object.keys(whereStatement).filter(column => whereStatement[column] === types_1.DreamConst.required);
                passthroughColumns =
                    whereStatement === null
                        ? passthroughColumns
                        : [
                            ...passthroughColumns,
                            ...Object.keys(whereStatement).filter(column => whereStatement[column] === types_1.DreamConst.passthrough),
                        ];
                return `${associationName}: {
        type: '${associationMetadata.type}',
        foreignKey: ${associationMetadata.foreignKey ? `'${associationMetadata.foreignKey}'` : 'null'},
        tables: ${stringifyArray(associationMetadata.tables)},
        optional: ${associationMetadata.optional},
        requiredWhereClauses: ${requiredWhereClauses.length === 0 ? 'null' : stringifyArray(requiredWhereClauses)},
      },`;
            })
                .join('\n      ')}
    },
  },\
`;
        })
            .join('\n  ')}
} as const`;
        return { schemaConstContent, passthroughColumns, allDefaultScopeNames };
    }
    async getSchemaImports(schemaContent) {
        const allExports = await this.getExportedModulesFromDbSync();
        const schemaContentWithoutImports = schemaContent.replace(/import {[^}]*}/gm, '');
        return allExports.filter(exportedModule => {
            if (new RegExp(`coercedType: {} as ${exportedModule}`).test(schemaContentWithoutImports))
                return true;
            if (new RegExp(`enumType: {} as ${exportedModule}`).test(schemaContentWithoutImports))
                return true;
            if (new RegExp(`enumValues: ${exportedModule}`).test(schemaContentWithoutImports))
                return true;
            return false;
        });
    }
    async tableData(tableName) {
        const dreamApp = dream_application_1.default.getOrFail();
        const models = Object.values(dreamApp.models);
        const model = models.find(model => model.table === tableName);
        if (!model)
            throw new Error(`
Could not find a Dream model with table "${tableName}".

If you recently changed the name of a table in a migration, you
may need to update the table getter in the corresponding Dream.
`);
        const associationData = this.getAssociationData(tableName);
        let serializers;
        try {
            serializers =
                model?.prototype?.['serializers'] || {};
        }
        catch {
            serializers = {};
        }
        return {
            primaryKey: model.prototype.primaryKey,
            createdAtField: model.prototype.createdAtField,
            updatedAtField: model.prototype.updatedAtField,
            deletedAtField: model.prototype.deletedAtField,
            scopes: {
                default: model['scopes'].default.map(scopeStatement => scopeStatement.method),
                named: model['scopes'].named.map(scopeStatement => scopeStatement.method),
            },
            columns: await this.getColumnData(tableName, associationData),
            virtualColumns: this.getVirtualColumns(tableName),
            associations: associationData,
            serializerKeys: Object.keys(serializers),
        };
    }
    async getColumnData(tableName, associationData) {
        const db = (0, db_1.default)('primary');
        const sqlQuery = (0, kysely_1.sql) `SELECT column_name, udt_name::regtype, is_nullable, data_type FROM information_schema.columns WHERE table_name = ${tableName}`;
        const columnToDBTypeMap = await sqlQuery.execute(db);
        const rows = columnToDBTypeMap.rows;
        const columnData = {};
        rows.forEach(row => {
            const isEnum = ['USER-DEFINED', 'ARRAY'].includes(row.dataType) && !(0, dataTypes_1.isPrimitiveDataType)(row.udtName);
            const isArray = ['ARRAY'].includes(row.dataType);
            const associationMetadata = associationData[row.columnName];
            columnData[(0, camelize_1.default)(row.columnName)] = {
                dbType: row.udtName,
                allowNull: row.isNullable === 'YES',
                enumType: isEnum ? this.enumType(row) : null,
                enumValues: isEnum ? `${this.enumType(row)}Values` : null,
                isArray,
                foreignKey: associationMetadata?.foreignKey || null,
            };
        });
        return Object.keys(columnData)
            .sort()
            .reduce((acc, key) => {
            acc[key] = columnData[key];
            return acc;
        }, {});
    }
    enumType(row) {
        const enumName = (0, pascalize_1.default)(row.udtName.replace(/\[\]$/, ''));
        return enumName;
    }
    getVirtualColumns(tableName) {
        const dreamApp = dream_application_1.default.getOrFail();
        const models = (0, lodash_sortby_1.default)(Object.values(dreamApp.models), m => m.table);
        const model = models.find(model => model.table === tableName);
        return model?.['virtualAttributes']?.map(prop => prop.property) || [];
    }
    async getSchemaData() {
        const tables = await this.getTables();
        const schemaData = {};
        for (const table of tables) {
            schemaData[table] = await this.tableData(table);
        }
        return schemaData;
    }
    getAssociationData(tableName, targetAssociationType) {
        const dreamApp = dream_application_1.default.getOrFail();
        const models = (0, lodash_sortby_1.default)(Object.values(dreamApp.models), m => m.table);
        const tableAssociationData = {};
        for (const model of models.filter(model => model.table === tableName)) {
            for (const associationName of model.associationNames) {
                const associationMetaData = model['associationMetadataMap']()[associationName];
                if (targetAssociationType && associationMetaData.type !== targetAssociationType)
                    continue;
                const dreamClassOrClasses = associationMetaData.modelCB();
                if (!dreamClassOrClasses)
                    throw new failed_to_identify_association_1.default(model, associationMetaData.type, associationName, associationMetaData.globalAssociationNameOrNames);
                const optional = associationMetaData.type === 'BelongsTo' ? associationMetaData.optional === true : null;
                const where = associationMetaData.type === 'HasMany' || associationMetaData.type === 'HasOne'
                    ? associationMetaData.where || null
                    : null;
                // NOTE
                // this try-catch is here because the SchemaBuilder currently needs to be run twice to generate foreignKey
                // correctly. The first time will raise, since calling Dream.columns is dependant on the schema const to
                // introspect columns during a foreign key check. This will be repaired once kysely types have been successfully
                // split off into a separate file from the types we diliver in schema.ts
                let foreignKey = null;
                try {
                    const _foreignKey = associationMetaData.foreignKey();
                    foreignKey = _foreignKey;
                }
                catch (_) {
                    // noop
                }
                tableAssociationData[associationName] ||= {
                    tables: [],
                    type: associationMetaData.type,
                    polymorphic: associationMetaData.polymorphic,
                    foreignKey,
                    optional,
                    where,
                };
                if (foreignKey)
                    tableAssociationData[associationName]['foreignKey'] = foreignKey;
                if (Array.isArray(dreamClassOrClasses)) {
                    const tables = dreamClassOrClasses.map(dreamClass => dreamClass.table);
                    tableAssociationData[associationName].tables = [
                        ...tableAssociationData[associationName].tables,
                        ...tables,
                    ];
                }
                else {
                    tableAssociationData[associationName].tables.push(dreamClassOrClasses.table);
                }
                // guarantee unique
                tableAssociationData[associationName].tables = [
                    ...new Set(tableAssociationData[associationName].tables),
                ];
            }
        }
        return Object.keys(tableAssociationData)
            .sort()
            .reduce((acc, key) => {
            acc[key] = tableAssociationData[key];
            return acc;
        }, {});
    }
    async getExportedModulesFromDbSync() {
        const fileContents = await this.loadDbSyncFile();
        const exportedConsts = [...fileContents.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)/g)].map(res => res[1]);
        const exportedTypes = [...fileContents.matchAll(/export\s+type\s+([a-zA-Z0-9_]+)/g)].map(res => res[1]);
        const exportedInterfaces = [...fileContents.matchAll(/export\s+interface\s+([a-zA-Z0-9_]+)/g)].map(res => res[1]);
        const allExports = [...exportedConsts, ...exportedTypes, ...exportedInterfaces];
        return allExports;
    }
    async getTables() {
        const fileContents = await this.loadDbSyncFile();
        const tableLines = /export interface DB {([^}]*)}/.exec(fileContents)[1];
        const tables = tableLines
            .split('\n')
            .map(line => line.split(':')[0].replace(/\s*/, ''))
            .filter(line => !!line);
        return tables;
    }
    kyselyType(tableName, columnName, fileContents) {
        const tableLines = /export interface DB {([^}]*)}/.exec(fileContents)[1];
        const interfaceName = tableLines
            .split('\n')
            .filter(line => !!line)
            .filter(line => new RegExp(`^  ${tableName}:`).test(line))[0]
            .split(':')[1]
            ?.replace(/[\s;]*/g, '');
        const interfaceLines = new RegExp(`export interface ${interfaceName} {([^}]*)}`).exec(fileContents)[1];
        const kyselyType = interfaceLines
            .split('\n')
            .filter(line => !!line)
            .filter(line => new RegExp(`  ${columnName}:`).test(line))[0]
            .split(':')[1]
            ?.replace(/[\s;]*/g, '');
        return kyselyType;
    }
    coercedType(kyselyType, dbType) {
        return kyselyType
            .replace(/\s/g, '')
            .replace(/Generated<(.*)>/, '$1')
            .split('|')
            .map(individualType => {
            const withoutGenerated = individualType.replace(/Generated<(.*)>/, '$1');
            switch (withoutGenerated) {
                case 'Numeric':
                    return 'number';
                case 'Timestamp':
                    return dbType === 'date' ? 'CalendarDate' : 'DateTime';
                case 'Int8':
                    return 'IdType';
                default:
                    return withoutGenerated;
            }
        })
            .join(' | ');
    }
    async loadDbSyncFile() {
        const dreamApp = dream_application_1.default.getOrFail();
        const dbSyncPath = path_1.default.join(dreamApp.projectRoot, dreamApp.paths.db, 'sync.ts');
        return (await promises_1.default.readFile(dbSyncPath)).toString();
    }
}
exports.default = SchemaBuilder;
function stringifyArray(arr = [], { indent } = {}) {
    if (indent && arr.length > 3) {
        let spaces = '';
        for (let i = 0; i < indent; i++) {
            spaces = `${spaces} `;
        }
        return `[
${spaces}${arr
            .sort()
            .map(val => `'${val}'`)
            .join(`,\n${spaces}`)}
${spaces.replace(/\s{2}$/, '')}]`;
    }
    else {
        return `[${arr
            .sort()
            .map(val => `'${val}'`)
            .join(', ')}]`;
    }
}
