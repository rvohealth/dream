"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pluralize_1 = __importDefault(require("pluralize"));
const invalid_decimal_field_passed_to_generator_1 = __importDefault(require("../../exceptions/invalid-decimal-field-passed-to-generator"));
const foreignKeyTypeFromPrimaryKey_1 = __importDefault(require("../db/foreignKeyTypeFromPrimaryKey"));
const snakeify_1 = __importDefault(require("../snakeify"));
function generateMigrationContent({ table, attributes = [], primaryKeyType = 'bigserial', createOrAlter = 'create', } = {}) {
    const altering = createOrAlter === 'alter';
    let requireCitextExtension = false;
    const { columnDefs, columnDrops } = attributes.reduce((acc, attribute) => {
        const { columnDefs, columnDrops } = acc;
        const [nonStandardAttributeName, attributeType, ...descriptors] = attribute.split(':');
        let attributeName = (0, snakeify_1.default)(nonStandardAttributeName);
        if (['has_one', 'has_many'].includes(attributeType))
            return acc;
        if (attributeType === 'citext')
            requireCitextExtension = true;
        const coercedAttributeType = getAttributeType(attribute);
        switch (attributeType) {
            case 'belongs_to':
                columnDefs.push(generateBelongsToStr(attributeName, { primaryKeyType }));
                attributeName = associationNameToForeignKey(attributeName);
                break;
            case 'enum':
                columnDefs.push(generateEnumStr(attribute));
                break;
            case 'decimal':
                columnDefs.push(generateDecimalStr(attribute));
                break;
            default:
                columnDefs.push(generateColumnStr(attributeName, coercedAttributeType, descriptors));
                break;
        }
        columnDrops.push(`.dropColumn('${attributeName}')`);
        return acc;
    }, { columnDefs: [], columnDrops: [] });
    if (!table) {
        return `\
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
}\
`;
    }
    const citextExtension = requireCitextExtension
        ? `await db.executeQuery(CompiledQuery.raw('CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;'))\n  `
        : '';
    const kyselyImports = ['Kysely', 'sql'];
    if (requireCitextExtension)
        kyselyImports.push('CompiledQuery');
    const newline = '\n    ';
    const columnDefLines = columnDefs.length ? newline + columnDefs.join(newline) : '';
    const columnDropLines = columnDrops.length ? newline + columnDrops.join(newline) + newline : '';
    return `\
import { ${kyselyImports.join(', ')} } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  ${citextExtension}${generateEnumStatements(attributes)}await db.schema
    .${altering ? 'alterTable' : 'createTable'}('${table}')${altering ? '' : newline + generateIdStr({ primaryKeyType })}${columnDefLines}${altering
        ? ''
        : newline +
            ".addColumn('created_at', 'timestamp', col => col.notNull())" +
            newline +
            ".addColumn('updated_at', 'timestamp', col => col.notNull())"}
    .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  ${altering
        ? `await db.schema${newline}.alterTable('${table}')${columnDropLines}.execute()`
        : `await db.schema.dropTable('${table}').execute()`}${generateEnumDropStatements(attributes)}
}\
`;
}
exports.default = generateMigrationContent;
function getAttributeType(attribute) {
    const [, attributeType, ...descriptors] = attribute.split(':');
    if (attributeType === 'enum') {
        return enumAttributeType(attribute)[0];
    }
    switch (attributeType) {
        case 'datetime':
            return 'timestamp';
        case 'string':
            return `varchar(${descriptors[0] || 255})`;
        default:
            return attributeType;
    }
}
function enumAttributeType(attribute) {
    const [, , ...descriptors] = attribute.split(':');
    return `sql\`${descriptors[0]}_enum\``;
}
function generateEnumStatements(attributes) {
    const enumStatements = attributes.filter(attribute => /:enum:.*:/.test(attribute));
    const finalStatements = enumStatements.map(statement => {
        const enumName = statement.split(':')[2];
        const attributes = statement.split(':')[3].split(/,\s{0,}/);
        return `await db.schema
    .createType('${enumName}_enum')
    .asEnum([
      ${attributes.map(attr => `'${attr}'`).join(',\n      ')}
    ])
    .execute()`;
    });
    return finalStatements.length ? finalStatements.join('\n\n  ') + '\n\n  ' : '';
}
function generateEnumDropStatements(attributes) {
    const enumStatements = attributes.filter(attribute => /:enum:.*:/.test(attribute));
    const finalStatements = enumStatements.map(statement => {
        const enumName = statement.split(':')[2];
        return `await db.schema.dropType('${enumName}_enum').execute()`;
    });
    return finalStatements.length ? '\n\n  ' + finalStatements.join('\n  ') : '';
}
function generateEnumStr(attribute) {
    const computedAttributeType = enumAttributeType(attribute);
    return `.addColumn('${attribute.split(':')[0]}', ${computedAttributeType})`;
}
function generateDecimalStr(attribute) {
    const [, , ...descriptors] = attribute.split(':');
    const [scale, precision] = descriptors[0]?.split(',') || [null, null];
    if (!scale || !precision)
        throw new invalid_decimal_field_passed_to_generator_1.default(attribute);
    return `.addColumn('${attribute.split(':')[0]}', 'decimal(${scale}, ${precision})')`;
}
function generateColumnStr(attributeName, attributeType, descriptors) {
    let returnStr = `.addColumn('${attributeName}', ${attributeTypeString(attributeType)}`;
    const providedDefaultArg = descriptors.find(d => /^default\(/.test(d));
    const providedDefault = providedDefaultArg?.replace(/^default\(/, '')?.replace(/\)$/, '');
    const hasExtraValues = descriptors.includes('primary') || providedDefault;
    if (hasExtraValues)
        returnStr += ', col => col';
    if (descriptors.includes('primary'))
        returnStr += `.defaultTo('${providedDefault}')`;
    if (providedDefault)
        returnStr += `.defaultTo('${providedDefault}')`;
    // TODO: handle index
    return `${returnStr}${hasExtraValues ? '))' : ')'}`;
}
function attributeTypeString(attributeType) {
    const attributeTypesRequiringSql = ['citext'];
    if (attributeTypesRequiringSql.includes(attributeType))
        return `sql\`${attributeType}\``;
    switch (attributeType) {
        case 'varbit':
        case 'bitvarying':
            return "'bit varying'";
        case 'txid_snapshot':
            return "'txid_snapshot'";
        default:
            return `'${attributeType.replace(/_/g, ' ')}'`;
    }
}
function generateBelongsToStr(associationName, { primaryKeyType }) {
    const dataType = (0, foreignKeyTypeFromPrimaryKey_1.default)(primaryKeyType);
    const references = (0, pluralize_1.default)(associationName.replace(/\//g, '_').replace(/_id$/, ''));
    return `.addColumn('${associationNameToForeignKey(associationName)}', '${dataType}', col => col.references('${references}.id').onDelete('restrict').notNull())`;
}
function generateIdStr({ primaryKeyType }) {
    return `.addColumn('id', '${primaryKeyType}', col => col.primaryKey())`;
}
function associationNameToForeignKey(associationName) {
    return (0, snakeify_1.default)(associationName.replace(/\//g, '_').replace(/_id$/, '') + '_id');
}
