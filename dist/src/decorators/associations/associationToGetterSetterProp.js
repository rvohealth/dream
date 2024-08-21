"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function associationToGetterSetterProp(association) {
    return `__${association.as}__`;
}
exports.default = associationToGetterSetterProp;
