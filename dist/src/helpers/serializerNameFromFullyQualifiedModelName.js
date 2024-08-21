"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const standardizeFullyQualifiedModelName_1 = __importDefault(require("./standardizeFullyQualifiedModelName"));
function default_1(fullyQualifiedModelName, serializerType = 'default') {
    fullyQualifiedModelName = (0, standardizeFullyQualifiedModelName_1.default)(fullyQualifiedModelName);
    switch (serializerType) {
        case 'default':
            return `${fullyQualifiedModelName}Serializer`;
        case 'summary':
            return `${fullyQualifiedModelName}SummarySerializer`;
    }
}
exports.default = default_1;
