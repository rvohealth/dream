"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CurriedOpsStatement {
    constructor(factoryFn) {
        this.factoryFn = factoryFn;
    }
    toOpsStatement(dreamClass, fieldName) {
        return this.factoryFn(dreamClass, fieldName);
    }
}
exports.default = CurriedOpsStatement;
