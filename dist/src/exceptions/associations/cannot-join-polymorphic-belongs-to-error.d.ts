import { BelongsToStatement } from '../../decorators/associations/belongs-to';
import Dream from '../../dream';
export default class CannotJoinPolymorphicBelongsToError extends Error {
    dreamClass: typeof Dream;
    association: BelongsToStatement<any, any, any, any>;
    joinsStatements: any;
    constructor({ dreamClass, association, joinsStatements, }: {
        dreamClass: typeof Dream;
        association: BelongsToStatement<any, any, any, any>;
        joinsStatements: any;
    });
    get message(): string;
}
