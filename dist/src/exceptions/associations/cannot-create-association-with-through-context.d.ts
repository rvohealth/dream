import { HasManyStatement } from '../../decorators/associations/has-many';
import { HasOneStatement } from '../../decorators/associations/has-one';
import Dream from '../../dream';
export default class CannotCreateAssociationWithThroughContext extends Error {
    dreamClass: typeof Dream;
    association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>;
    constructor({ dreamClass, association, }: {
        dreamClass: typeof Dream;
        association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>;
    });
    get message(): string;
}
