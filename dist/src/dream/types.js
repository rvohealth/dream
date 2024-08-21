"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIGRAM_OPERATORS = exports.DreamConst = exports.primaryKeyTypes = void 0;
exports.primaryKeyTypes = ['bigserial', 'bigint', 'uuid', 'integer'];
class Required {
    constructor() { }
}
class Passthrough {
    constructor() { }
}
exports.DreamConst = {
    passthrough: Passthrough,
    required: Required,
};
exports.TRIGRAM_OPERATORS = ['%', '<%', '<<%'];
