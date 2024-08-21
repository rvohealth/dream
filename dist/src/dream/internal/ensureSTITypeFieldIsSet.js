"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ensureSTITypeFieldIsSet(dream) {
    const Base = dream.constructor;
    if (Base['sti'].value && !dream.type) {
        ;
        dream.type = Base['sti'].value;
    }
}
exports.default = ensureSTITypeFieldIsSet;
