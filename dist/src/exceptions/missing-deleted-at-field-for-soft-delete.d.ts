import Dream from '../dream';
export default class MissingDeletedAtFieldForSoftDelete extends Error {
    private dreamClass;
    constructor(dreamClass: typeof Dream);
    get message(): string;
}
