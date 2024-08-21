export default class CannotNegateSimilarityClause extends Error {
    private tableName;
    private columnName;
    private value;
    constructor(tableName: string, columnName: string, value: any);
    get message(): string;
}
