export default class InvalidColumnName extends Error {
    private tableName;
    private columnName;
    constructor(tableName: string, columnName: string);
    get message(): string;
}
