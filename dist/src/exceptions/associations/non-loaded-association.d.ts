import Dream from '../../dream';
export default class NonLoadedAssociation extends Error {
    dreamClass: typeof Dream;
    associationName: string;
    constructor({ dreamClass, associationName }: {
        dreamClass: typeof Dream;
        associationName: string;
    });
    get message(): string;
}
