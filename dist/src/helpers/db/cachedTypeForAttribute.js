"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function cachedTypeForAttribute(dreamClass, attribute) {
    return dreamClass.prototype.schema[dreamClass.table]?.['columns']?.[attribute]?.['dbType'];
}
exports.default = cachedTypeForAttribute;
