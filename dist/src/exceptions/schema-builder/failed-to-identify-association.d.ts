import Dream from '../../dream';
export default class FailedToIdentifyAssociation extends Error {
    private modelClass;
    private associationType;
    private associationName;
    private globalAssociationNameOrNames;
    constructor(modelClass: typeof Dream, associationType: string, associationName: string, globalAssociationNameOrNames: string | string[]);
    get message(): string;
}
