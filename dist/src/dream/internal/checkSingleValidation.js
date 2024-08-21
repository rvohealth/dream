"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const non_loaded_association_1 = __importDefault(require("../../exceptions/associations/non-loaded-association"));
function checkSingleValidation(dream, validation) {
    let value;
    try {
        value = dream[validation.column];
    }
    catch (error) {
        if (error.constructor !== non_loaded_association_1.default)
            throw error;
    }
    let parsedFloat;
    switch (validation.type) {
        case 'presence':
            return !isBlank(value);
        case 'numericality':
            if (isBlank(value))
                return true;
            if (isNaN(value))
                return false;
            parsedFloat = parseFloat(value);
            if (validation.options?.numericality?.max?.constructor === Number &&
                parsedFloat > validation.options?.numericality?.max)
                return false;
            if (validation.options?.numericality?.min?.constructor === Number &&
                parsedFloat < validation.options?.numericality?.min)
                return false;
            return true;
        case 'contains':
            switch (validation.options.contains.value.constructor) {
                case String:
                    return new RegExp(validation.options.contains.value).test(value);
                case RegExp:
                    return validation.options.contains.value.test(value);
            }
            break;
        case 'length':
            return (value?.length &&
                value.length >= validation.options.length.min &&
                validation.options.length.max &&
                value.length <= validation.options.length.max);
        case 'requiredBelongsTo':
            return !!(value || dream[dream['associationMetadataMap']()[validation.column].foreignKey()]);
        default:
            throw new Error(`Unhandled validation type found while running validations: ${validation.type}`);
    }
}
exports.default = checkSingleValidation;
function isBlank(value) {
    return [undefined, null, ''].includes(value);
}
