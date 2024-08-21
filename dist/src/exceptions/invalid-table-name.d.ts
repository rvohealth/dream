export default class InvalidTableName extends Error {
    private schema;
    private tableName;
    constructor(schema: any, tableName: string);
    get message(): string;
}
