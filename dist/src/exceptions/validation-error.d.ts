import { ValidationType } from '../decorators/validations/shared';
export default class ValidationError extends Error {
    dreamClassName: string;
    errors: {
        [key: string]: ValidationType[];
    };
    constructor(dreamClassName: string, errors: {
        [key: string]: ValidationType[];
    });
    get message(): string;
}
