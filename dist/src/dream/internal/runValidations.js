"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const checkSingleValidation_1 = __importDefault(require("./checkSingleValidation"));
function runValidations(dream) {
    const Base = dream.constructor;
    Base['validations'].forEach(validation => runValidation(dream, validation));
    for (const methodName of Base['customValidations']) {
        ;
        dream[methodName]();
    }
}
exports.default = runValidations;
function runValidation(dream, validation) {
    if (!(0, checkSingleValidation_1.default)(dream, validation))
        dream.addError(validation.column, validation.type);
}
