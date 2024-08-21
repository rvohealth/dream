export default class GlobalNameNotSet extends Error {
    private klass;
    constructor(klass: any);
    get message(): string;
}
