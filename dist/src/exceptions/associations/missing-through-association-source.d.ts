import { HasManyStatement } from '../../decorators/associations/has-many';
import { HasOneStatement } from '../../decorators/associations/has-one';
import Dream from '../../dream';
export default class MissingThroughAssociationSource extends Error {
    dreamClass: typeof Dream;
    throughClass: typeof Dream;
    association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>;
    constructor({ dreamClass, throughClass, association, }: {
        dreamClass: typeof Dream;
        throughClass: typeof Dream;
        association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>;
    });
    get message(): string;
}
