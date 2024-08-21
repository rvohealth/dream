import Dream from '../dream';
export default class NonBelongsToAssociationProvidedAsSortableDecoratorScope extends Error {
    private scope;
    private dreamClass;
    constructor(scope: string, dreamClass: typeof Dream);
    get message(): string;
}
