export default class FailedToRenderThroughAssociationForSerializer extends Error {
    className: any;
    missingThroughField: string;
    constructor(className: any, missingThroughField: string);
    get message(): string;
}
