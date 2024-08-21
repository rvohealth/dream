"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SerializerNameConflict extends Error {
    constructor(serializerGlobalName) {
        super();
        this.serializerGlobalName = serializerGlobalName;
    }
    get message() {
        return `
Attempted to register ${this.serializerGlobalName}, but another serializer
has the sane name.`;
    }
}
exports.default = SerializerNameConflict;
