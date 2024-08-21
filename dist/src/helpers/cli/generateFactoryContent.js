"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const camelize_1 = __importDefault(require("../camelize"));
const globalClassNameFromFullyQualifiedModelName_1 = __importDefault(require("../globalClassNameFromFullyQualifiedModelName"));
const relativeDreamPath_1 = __importDefault(require("../path/relativeDreamPath"));
const standardizeFullyQualifiedModelName_1 = __importDefault(require("../standardizeFullyQualifiedModelName"));
const uniq_1 = __importDefault(require("../uniq"));
function generateFactoryContent(fullyQualifiedModelName, attributes) {
    fullyQualifiedModelName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    const dreamImports = ['UpdateableProperties'];
    const additionalImports = [];
    const belongsToNames = [];
    const belongsToTypedNames = [];
    for (const attribute of attributes) {
        const [attributeName, attributeType] = attribute.split(':');
        const fullyQualifiedAssociatedModelName = (0, standardizeFullyQualifiedModelName_1.default)(attributeName);
        const associationModelName = (0, globalClassNameFromFullyQualifiedModelName_1.default)(fullyQualifiedAssociatedModelName);
        const associationImportStatement = `import ${associationModelName} from '${(0, relativeDreamPath_1.default)('factories', 'models', fullyQualifiedAssociatedModelName)}'`;
        const associationName = (0, camelize_1.default)(associationModelName);
        if (!attributeType)
            throw `must pass a column type for ${fullyQualifiedAssociatedModelName} (i.e. ${fullyQualifiedAssociatedModelName}:string)`;
        switch (attributeType) {
            case 'belongs_to':
                belongsToNames.push(associationName);
                belongsToTypedNames.push(`${associationName}: ${associationModelName}`);
                additionalImports.push(associationImportStatement);
                break;
            default:
            // noop
        }
    }
    const relativePath = (0, relativeDreamPath_1.default)('factories', 'models', fullyQualifiedModelName);
    const modelClassName = (0, globalClassNameFromFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    const args = [...belongsToTypedNames, `overrides: UpdateableProperties<${modelClassName}> = {}`];
    return `\
import { ${(0, uniq_1.default)(dreamImports).join(', ')} } from '@rvohealth/dream'
import ${modelClassName} from '${relativePath}'${additionalImports.length ? '\n' + (0, uniq_1.default)(additionalImports).join('\n') : ''}

export default async function create${modelClassName}(${args.join(', ')}) {
  return await ${modelClassName}.create({
    ${belongsToNames.join(',\n    ')}${belongsToNames.length ? ',\n    ' : ''}...overrides,
  })
}
`;
}
exports.default = generateFactoryContent;
