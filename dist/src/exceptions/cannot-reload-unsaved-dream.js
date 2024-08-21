"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotReloadUnsavedDream extends Error {
    constructor(dream) {
        super();
        this.dream = dream;
    }
    get message() {
        return `
Cannot reload a Dream that has not yet been persisted
  dream: ${this.dream.constructor.name}
    `;
    }
}
exports.default = CannotReloadUnsavedDream;
