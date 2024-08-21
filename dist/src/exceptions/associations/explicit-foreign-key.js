"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForeignKey = exports.ExplicitForeignKeyRequired = exports.InvalidComputedForeignKey = void 0;
const shared_1 = require("../../decorators/associations/shared");
class InvalidComputedForeignKey extends Error {
    constructor(dreamClass, partialAssociation, computedForeignKey, table) {
        super();
        this.dreamClass = dreamClass;
        this.partialAssociation = partialAssociation;
        this.computedForeignKey = computedForeignKey;
        this.table = table;
    }
    get message() {
        return `
Add an explicit foreignKey declaration to this association declaration:
  Dream class: ${this.dreamClass.name}
  Association: ${this.partialAssociation.as}
Dream tried ${this.computedForeignKey} automatically, but it isn't a column in table ${this.table}.
    `;
    }
}
exports.InvalidComputedForeignKey = InvalidComputedForeignKey;
class ExplicitForeignKeyRequired extends Error {
    constructor(dreamClass, partialAssociation, explicitForeignKey, table) {
        super();
        this.dreamClass = dreamClass;
        this.partialAssociation = partialAssociation;
        this.explicitForeignKey = explicitForeignKey;
        this.table = table;
    }
    get message() {
        return `
${this.explicitForeignKey} is not a valid column on table ${this.table}.
Fix the foreignKey declaration on:
  Dream class: ${this.dreamClass.name}
  Association: ${this.partialAssociation.as}
    `;
    }
}
exports.ExplicitForeignKeyRequired = ExplicitForeignKeyRequired;
function checkForeignKey(explicitForeignKey, computedForeignKey, dreamClass, partialAssociation) {
    let table;
    if (partialAssociation.type === 'BelongsTo')
        table = dreamClass.table;
    else
        table = (0, shared_1.modelCBtoSingleDreamClass)(dreamClass, partialAssociation).table;
    const tableColumns = Object.keys(dreamClass.prototype.schema[table]?.columns);
    const validForeignKey = tableColumns.includes(computedForeignKey);
    if (validForeignKey)
        return;
    if (explicitForeignKey)
        throw new ExplicitForeignKeyRequired(dreamClass, partialAssociation, explicitForeignKey, table);
    else
        throw new InvalidComputedForeignKey(dreamClass, partialAssociation, computedForeignKey, table);
}
exports.checkForeignKey = checkForeignKey;
