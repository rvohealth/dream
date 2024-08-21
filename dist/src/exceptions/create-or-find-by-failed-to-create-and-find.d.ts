import Dream from '../dream';
export default class CreateOrFindByFailedToCreateAndFind extends Error {
    private dreamClass;
    constructor(dreamClass: typeof Dream);
    get message(): string;
}
