"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function testEnv() {
    return process.env.NODE_ENV === 'test';
}
exports.default = testEnv;
