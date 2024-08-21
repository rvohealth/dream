import Dream from '../dream';
export default class CannotCallUndestroyOnANonSoftDeleteModel extends Error {
    private dreamClass;
    constructor(dreamClass: typeof Dream);
    get message(): string;
}
