"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GlobalNameNotSet extends Error {
    constructor(klass) {
        super();
        this.klass = klass;
    }
    get message() {
        return `
Attempted to reference global name for ${this.klass.name}, but the global name has not been set.`;
    }
}
exports.default = GlobalNameNotSet;
