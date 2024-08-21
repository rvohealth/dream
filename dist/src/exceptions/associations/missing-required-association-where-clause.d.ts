import { HasManyStatement } from '../../decorators/associations/has-many';
import { HasOneStatement } from '../../decorators/associations/has-one';
export default class MissingRequiredAssociationWhereClause extends Error {
    private association;
    private column;
    constructor(association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>, column: string);
    get message(): string;
}
