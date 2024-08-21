export default class MissingRequiredPassthroughForAssociationWhereClause extends Error {
    private column;
    constructor(column: string);
    get message(): string;
}
