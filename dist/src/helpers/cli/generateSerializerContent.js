"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pluralize_1 = __importDefault(require("pluralize"));
const camelize_1 = __importDefault(require("../camelize"));
const globalClassNameFromFullyQualifiedModelName_1 = __importDefault(require("../globalClassNameFromFullyQualifiedModelName"));
const pascalize_1 = __importDefault(require("../pascalize"));
const relativeDreamPath_1 = __importDefault(require("../path/relativeDreamPath"));
const serializerNameFromFullyQualifiedModelName_1 = __importDefault(require("../serializerNameFromFullyQualifiedModelName"));
const standardizeFullyQualifiedModelName_1 = __importDefault(require("../standardizeFullyQualifiedModelName"));
const uniq_1 = __importDefault(require("../uniq"));
function generateSerializerContent(fullyQualifiedModelName, attributes = [], fullyQualifiedParentName) {
    fullyQualifiedModelName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    const additionalImports = [];
    let relatedModelImport = '';
    let modelClassName = '';
    let dataTypeCapture = '';
    const dreamImports = [];
    let dreamSerializerTypeArgs = '';
    const isSTI = !!fullyQualifiedParentName;
    if (isSTI) {
        fullyQualifiedParentName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedParentName);
        additionalImports.push(importStatementForSerializer(fullyQualifiedModelName, fullyQualifiedParentName));
    }
    else {
        dreamImports.push('Attribute');
        dreamImports.push('DreamColumn');
        dreamImports.push('DreamSerializer');
    }
    relatedModelImport = importStatementForModel(fullyQualifiedModelName);
    modelClassName = (0, globalClassNameFromFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    dataTypeCapture = `<
  DataType extends ${modelClassName},
  Passthrough extends object,
>`;
    dreamSerializerTypeArgs = `<DataType, Passthrough>`;
    const defaultSerialzerClassName = (0, globalClassNameFromFullyQualifiedModelName_1.default)((0, serializerNameFromFullyQualifiedModelName_1.default)(fullyQualifiedModelName));
    const summarySerialzerClassName = (0, globalClassNameFromFullyQualifiedModelName_1.default)((0, serializerNameFromFullyQualifiedModelName_1.default)(fullyQualifiedModelName, 'summary'));
    const defaultSerialzerExtends = isSTI
        ? (0, globalClassNameFromFullyQualifiedModelName_1.default)((0, serializerNameFromFullyQualifiedModelName_1.default)(fullyQualifiedParentName))
        : summarySerialzerClassName;
    const summarySerialzerExtends = isSTI
        ? (0, globalClassNameFromFullyQualifiedModelName_1.default)((0, serializerNameFromFullyQualifiedModelName_1.default)(fullyQualifiedParentName, 'summary'))
        : 'DreamSerializer';
    if (attributes.find(attr => /:belongs_to|:has_one/.test(attr)))
        dreamImports.push('RendersOne');
    if (attributes.find(attr => /:has_many/.test(attr)))
        dreamImports.push('RendersMany');
    const additionalModelImports = [];
    attributes.forEach(attr => {
        const [name, type] = attr.split(':');
        if (['belongs_to', 'has_one', 'has_many'].includes(type)) {
            const fullyQualifiedAssociatedModelName = (0, standardizeFullyQualifiedModelName_1.default)(name);
            additionalModelImports.push(importStatementForModel(fullyQualifiedModelName, fullyQualifiedAssociatedModelName));
        }
        else {
            dreamImports.push('Attribute');
            dreamImports.push('DreamColumn');
        }
    });
    let dreamImport = '';
    if (dreamImports.length) {
        dreamImport = `import { ${(0, uniq_1.default)(dreamImports).join(', ')} } from '@rvohealth/dream'`;
    }
    const additionalImportsStr = additionalImports.length ? (0, uniq_1.default)(additionalImports).join('') : '';
    return `\
${dreamImport}${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}

export class ${summarySerialzerClassName}${dataTypeCapture} extends ${summarySerialzerExtends}${dreamSerializerTypeArgs} {
${isSTI
        ? ''
        : `  @Attribute(${modelClassName})
  public id: DreamColumn<${modelClassName}, 'id'>
`}}

export default class ${defaultSerialzerClassName}${dataTypeCapture} extends ${defaultSerialzerExtends}${dreamSerializerTypeArgs} {
${attributes
        .map(attr => {
        const [name, type] = attr.split(':');
        const fullyQualifiedAssociatedModelName = (0, standardizeFullyQualifiedModelName_1.default)(name);
        const associatedModelName = (0, globalClassNameFromFullyQualifiedModelName_1.default)(fullyQualifiedAssociatedModelName);
        const propertyName = (0, camelize_1.default)(associatedModelName);
        switch (type) {
            case 'belongs_to':
            case 'has_one':
                return `  @RendersOne(${associatedModelName})
  public ${propertyName}: ${associatedModelName}`;
            case 'has_many':
                return `  @RendersMany(${associatedModelName})
  public ${(0, pluralize_1.default)(propertyName)}: ${associatedModelName}[]`;
            default:
                return `  @Attribute(${modelClassName}${attributeOptionsSpecifier(type, attr)})
  public ${propertyName}: ${jsType(type, attr, propertyName, modelClassName)}`;
        }
    })
        .join('\n\n  ')}
}
`;
}
exports.default = generateSerializerContent;
function attributeOptionsSpecifier(type, attr) {
    switch (type) {
        case 'decimal':
            return `, { precision: ${attr.split(',').pop()} }`;
        default:
            return '';
    }
}
function jsType(type, originalAttribute, propertyName, modelClass = null) {
    if (modelClass)
        return `DreamColumn<${modelClass}, '${propertyName}'>`;
    switch (type) {
        case 'date':
            return 'CalendarDate';
        case 'datetime':
            return 'DateTime';
        case 'decimal':
        case 'integer':
        case 'number':
            return 'number';
        case 'string':
        case 'text':
        case 'bigint':
        case 'uuid':
            return 'string';
        case 'enum':
            return (0, pascalize_1.default)(originalAttribute.split(':')[2]) + 'Enum';
        default:
            return 'any';
    }
}
function importStatementForSerializer(originModelName, destinationModelName) {
    return `\nimport ${(0, globalClassNameFromFullyQualifiedModelName_1.default)((0, serializerNameFromFullyQualifiedModelName_1.default)(destinationModelName))}, { ${(0, globalClassNameFromFullyQualifiedModelName_1.default)((0, serializerNameFromFullyQualifiedModelName_1.default)(destinationModelName, 'summary'))} } from '${(0, relativeDreamPath_1.default)('serializers', 'serializers', originModelName, destinationModelName)}'`;
}
function importStatementForModel(originModelName, destinationModelName = originModelName) {
    return `\nimport ${(0, globalClassNameFromFullyQualifiedModelName_1.default)(destinationModelName)} from '${(0, relativeDreamPath_1.default)('serializers', 'models', originModelName, destinationModelName)}'`;
}
