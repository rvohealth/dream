"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateUnitSpecContent(dreamName) {
    return `\
// import { describe as context } from '@jest/globals'

describe('${dreamName}', () => {
  it.todo('add a test here to get started building ${dreamName}')
})
`;
}
exports.default = generateUnitSpecContent;
