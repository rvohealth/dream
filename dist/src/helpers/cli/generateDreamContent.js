"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pluralize_1 = __importDefault(require("pluralize"));
const camelize_1 = __importDefault(require("../camelize"));
const globalClassNameFromFullyQualifiedModelName_1 = __importDefault(require("../globalClassNameFromFullyQualifiedModelName"));
const relativeDreamPath_1 = __importDefault(require("../path/relativeDreamPath"));
const serializerNameFromFullyQualifiedModelName_1 = __importDefault(require("../serializerNameFromFullyQualifiedModelName"));
const snakeify_1 = __importDefault(require("../snakeify"));
const standardizeFullyQualifiedModelName_1 = __importDefault(require("../standardizeFullyQualifiedModelName"));
const uniq_1 = __importDefault(require("../uniq"));
function generateDreamContent(fullyQualifiedModelName, attributes, fullyQualifiedParentName) {
    fullyQualifiedModelName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    const modelClassName = (0, globalClassNameFromFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    let parentModelClassName;
    const dreamImports = ['DreamColumn', 'DreamSerializers'];
    const isSTI = !!fullyQualifiedParentName;
    if (isSTI) {
        fullyQualifiedParentName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedParentName);
        parentModelClassName = (0, globalClassNameFromFullyQualifiedModelName_1.default)(fullyQualifiedParentName);
        dreamImports.push('STI');
    }
    const idTypescriptType = `DreamColumn<${modelClassName}, 'id'>`;
    const modelImportStatements = isSTI
        ? [importStatementForModel(fullyQualifiedModelName, fullyQualifiedParentName)]
        : [importStatementForModel(fullyQualifiedModelName, 'ApplicationModel')];
    const attributeStatements = attributes.map(attribute => {
        const [attributeName, attributeType] = attribute.split(':');
        const fullyQualifiedAssociatedModelName = (0, standardizeFullyQualifiedModelName_1.default)(attributeName);
        const associationModelName = (0, globalClassNameFromFullyQualifiedModelName_1.default)(fullyQualifiedAssociatedModelName);
        const associationImportStatement = importStatementForModel(fullyQualifiedModelName, fullyQualifiedAssociatedModelName);
        const associationName = (0, camelize_1.default)(associationModelName);
        if (!attributeType)
            throw new Error(`must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`);
        switch (attributeType) {
            case 'belongs_to':
                modelImportStatements.push(associationImportStatement);
                return `
@${modelClassName}.BelongsTo('${fullyQualifiedAssociatedModelName}')
public ${associationName}: ${associationModelName}
public ${associationName}Id: DreamColumn<${modelClassName}, '${associationName}Id'>
`;
            case 'has_one':
                modelImportStatements.push(associationImportStatement);
                return `
@${modelClassName}.HasOne('${fullyQualifiedAssociatedModelName}')
public ${associationName}: ${associationModelName}
`;
            case 'has_many':
                modelImportStatements.push(associationImportStatement);
                return `
@${modelClassName}.HasMany('${fullyQualifiedAssociatedModelName}')
public ${(0, pluralize_1.default)(associationName)}: ${associationModelName}[]
`;
            default:
                return `
public ${(0, camelize_1.default)(attributeName)}: ${getAttributeType(attribute, modelClassName)}\
`;
        }
    });
    const formattedFields = attributeStatements
        .filter(attr => !/^\n@/.test(attr))
        .map(s => s.split('\n').join('\n  '))
        .join('');
    const formattedDecorators = attributeStatements
        .filter(attr => /^\n@/.test(attr))
        .map(s => s.split('\n').join('\n  '))
        .join('\n  ')
        .replace(/\n {2}$/, '');
    let timestamps = `
  public createdAt: DreamColumn<${modelClassName}, 'createdAt'>
  public updatedAt: DreamColumn<${modelClassName}, 'updatedAt'>
`;
    if (!formattedDecorators.length)
        timestamps = timestamps.replace(/\n$/, '');
    const tableName = (0, snakeify_1.default)((0, pluralize_1.default)(fullyQualifiedModelName.replace(/\//g, '_')));
    return `\
import { ${(0, uniq_1.default)(dreamImports).join(', ')} } from '@rvohealth/dream'${(0, uniq_1.default)(modelImportStatements).join('')}

${isSTI ? `\n@STI(${parentModelClassName})` : ''}
export default class ${modelClassName} extends ${isSTI ? parentModelClassName : 'ApplicationModel'} {
${isSTI
        ? ''
        : `  public get table() {
    return '${tableName}' as const
  }

`}  public get serializers(): DreamSerializers<${modelClassName}> {
    return {
      default: '${(0, serializerNameFromFullyQualifiedModelName_1.default)(fullyQualifiedModelName)}',
      summary: '${(0, serializerNameFromFullyQualifiedModelName_1.default)(fullyQualifiedModelName, 'summary')}',
    }
  }

${isSTI ? formattedFields : `  public id: ${idTypescriptType}${formattedFields}${timestamps}`}${formattedDecorators}
}
`.replace(/^\s*$/gm, '');
}
exports.default = generateDreamContent;
function getAttributeType(attribute, modelClassName) {
    return `DreamColumn<${modelClassName}, '${(0, camelize_1.default)(attribute.split(':')[0])}'>`;
}
function importStatementForModel(originModelName, destinationModelName = originModelName) {
    return `\nimport ${(0, globalClassNameFromFullyQualifiedModelName_1.default)(destinationModelName)} from '${(0, relativeDreamPath_1.default)('models', 'models', originModelName, destinationModelName)}'`;
}
