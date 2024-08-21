export default class PrototypePollutingAssignment extends Error {
    private key;
    constructor(key: string);
    get message(): string;
}
