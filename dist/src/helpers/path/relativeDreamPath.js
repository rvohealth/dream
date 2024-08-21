"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dreamPathTypeRelativePath = void 0;
const pascalize_1 = __importDefault(require("../pascalize"));
const standardizeFullyQualifiedModelName_1 = __importDefault(require("../standardizeFullyQualifiedModelName"));
const dreamPath_1 = __importDefault(require("./dreamPath"));
const sharedPathPrefix_1 = __importDefault(require("./sharedPathPrefix"));
function default_1(originDreamPathType, destinationDreamPathType, fullyQualifiedOriginModelName, fullyQualifiedDestinationModelName = fullyQualifiedOriginModelName) {
    fullyQualifiedOriginModelName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedOriginModelName);
    fullyQualifiedDestinationModelName = (0, pascalize_1.default)(fullyQualifiedDestinationModelName);
    let pathToRemove = fullyQualifiedOriginModelName;
    if (originDreamPathType === destinationDreamPathType) {
        const sharedPrefixLength = (0, sharedPathPrefix_1.default)(fullyQualifiedOriginModelName, fullyQualifiedDestinationModelName).length;
        pathToRemove = fullyQualifiedOriginModelName.slice(sharedPrefixLength);
        fullyQualifiedDestinationModelName = fullyQualifiedDestinationModelName.slice(sharedPrefixLength);
    }
    const numAdditionalUpdirs = pathToRemove.split('/').length - 1;
    let additionalUpdirs = '';
    for (let i = 0; i < numAdditionalUpdirs; i++) {
        additionalUpdirs = `../${additionalUpdirs}`;
    }
    const baseRelativePath = dreamPathTypeRelativePath(originDreamPathType, destinationDreamPathType);
    let destinationPath = additionalUpdirs + (baseRelativePath.length ? baseRelativePath + '/' : '');
    if (destinationPath[0] !== '.')
        destinationPath = `./${destinationPath}`;
    switch (destinationDreamPathType) {
        case 'db':
            return destinationPath;
        case 'factories':
            return `${destinationPath}${fullyQualifiedDestinationModelName}Factory`;
        case 'serializers':
            return `${destinationPath}${fullyQualifiedDestinationModelName}Serializer`;
        default:
            return `${destinationPath}${fullyQualifiedDestinationModelName}`;
    }
}
exports.default = default_1;
function dreamPathTypeRelativePath(originDreamPathType, destinationDreamPathType) {
    const originPath = (0, dreamPath_1.default)(originDreamPathType);
    const destinationPath = (0, dreamPath_1.default)(destinationDreamPathType);
    const sharedPrefixLength = (0, sharedPathPrefix_1.default)(originPath, destinationPath).length;
    const originPathToRemove = originPath.slice(sharedPrefixLength);
    const updirs = originPathToRemove.length === 0
        ? ''
        : originPathToRemove
            .split('/')
            .map(() => '../')
            .join('');
    return updirs + destinationPath.slice(sharedPrefixLength);
}
exports.dreamPathTypeRelativePath = dreamPathTypeRelativePath;
