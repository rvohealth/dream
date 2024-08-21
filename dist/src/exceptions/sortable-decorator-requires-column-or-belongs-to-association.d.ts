import Dream from '../dream';
export default class SortableDecoratorRequiresColumnOrBelongsToAssociation extends Error {
    private attributeOrScope;
    private dreamClass;
    constructor(attributeOrScope: string, dreamClass: typeof Dream);
    get message(): string;
}
