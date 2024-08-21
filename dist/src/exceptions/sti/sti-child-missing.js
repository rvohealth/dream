"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class STIChildMissing extends Error {
    constructor(baseDreamClass, extendingDreamClassName, primaryKeyValue) {
        super();
        this.baseDreamClass = baseDreamClass;
        this.extendingDreamClassName = extendingDreamClassName;
        this.primaryKeyValue = primaryKeyValue;
    }
    get message() {
        return `
Missing STI child class
Base Dream class: ${this.baseDreamClass.name}
Type specified in DB record: ${this.extendingDreamClassName}
Table: ${this.baseDreamClass.table}
Primary key value: ${this.primaryKeyValue}
    `;
    }
}
exports.default = STIChildMissing;
