import Dream from '../dream';
export default class CannotDefineAssociationWithBothDependentAndPassthrough extends Error {
    private dreamClass;
    private associationName;
    constructor(dreamClass: typeof Dream, associationName: string);
    get message(): string;
}
