import Dream from '../dream';
export default class MissingSerializersDefinition extends Error {
    dreamClass: typeof Dream;
    constructor(dreamClass: typeof Dream);
    get message(): string;
}
