"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationInstantiationError = void 0;
function Validates(type, args) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (target, key, _) {
        const t = target.constructor;
        if (!Object.getOwnPropertyDescriptor(t, 'validations'))
            t['validations'] = [...(t['validations'] || [])];
        t['validations'].push({
            type,
            column: key,
            options: extractValidationOptionsFromArgs(type, args),
        });
    };
}
exports.default = Validates;
function extractValidationOptionsFromArgs(type, args) {
    switch (type) {
        case 'presence':
            return { presence: {} };
        case 'numericality':
            return {
                numericality: {
                    max: args?.max,
                    min: args?.min,
                },
            };
        case 'contains':
            if (!['String', 'RegExp'].includes(args.constructor.name))
                throw new ValidationInstantiationError(`When validating using "contains", the second argument must be a string or regular expression`);
            return { contains: { value: args } };
        case 'length':
            if (typeof args === 'number') {
                return { length: { min: args } };
            }
            else if (args?.min) {
                return { length: { min: args.min, max: args?.max } };
            }
            else {
                throw new ValidationInstantiationError(`
          When validating using "length", the second argument must be a number representing
          the min length, or else an object expressing both min and max length, like so:
          
          @Validates('length', { min: 4, max: 32 })
        `);
            }
        case 'requiredBelongsTo':
            return {};
        default:
            throw new Error(`Unhandled validation type when caching options: ${type}`);
    }
}
class ValidationInstantiationError extends Error {
}
exports.ValidationInstantiationError = ValidationInstantiationError;
