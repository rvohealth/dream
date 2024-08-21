"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NoUpdateAllOnJoins extends Error {
    get message() {
        return `
udpateAll may not yet be called on joins. As a workaround,
use where + nestedSelect instead, e.g.:

  ModelA.where({ id: ModelB.nestedSelect('modelAId') })
`;
    }
}
exports.default = NoUpdateAllOnJoins;
