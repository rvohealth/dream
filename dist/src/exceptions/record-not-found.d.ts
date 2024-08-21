export default class RecordNotFound extends Error {
    dreamClassName: string;
    constructor(dreamClassName: string);
    get message(): string;
}
