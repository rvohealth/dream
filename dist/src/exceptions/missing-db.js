"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MissingDB extends Error {
    constructor() {
        super();
    }
    get message() {
        return `
Missing DB definition on the ApplicationModel of your app
    `;
    }
}
exports.default = MissingDB;
