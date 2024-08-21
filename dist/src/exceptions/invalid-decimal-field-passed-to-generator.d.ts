export default class InvalidDecimalFieldPassedToGenerator extends Error {
    attribute: string;
    constructor(attribute: string);
    get message(): string;
}
