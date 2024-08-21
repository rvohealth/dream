"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FailedToRenderThroughAssociationForSerializer extends Error {
    constructor(className, missingThroughField) {
        super();
        this.className = className;
        this.missingThroughField = missingThroughField;
    }
    get message() {
        return `
Failed to render association data for ${this.className}
missing through field: "${this.missingThroughField}"`;
    }
}
exports.default = FailedToRenderThroughAssociationForSerializer;
