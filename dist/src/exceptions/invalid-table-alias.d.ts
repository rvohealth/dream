export default class InvalidTableAlias extends Error {
    private tableAlias;
    constructor(tableAlias: string);
    get message(): string;
}
