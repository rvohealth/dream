export default class SerializerNameConflict extends Error {
    private serializerGlobalName;
    constructor(serializerGlobalName: string);
    get message(): string;
}
