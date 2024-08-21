import { BelongsToStatement } from '../../decorators/associations/belongs-to';
import Dream from '../../dream';
export default class CannotPassNullOrUndefinedToRequiredBelongsTo extends Error {
    dreamClass: typeof Dream;
    association: BelongsToStatement<any, any, any, any>;
    constructor(dreamClass: typeof Dream, association: BelongsToStatement<any, any, any, any>);
    get message(): string;
}
