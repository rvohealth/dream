"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STI_SCOPE_NAME = void 0;
const scope_1 = __importDefault(require("./scope"));
exports.STI_SCOPE_NAME = 'dream:STI';
function STI(dreamClass, { value } = {}) {
    return function (target) {
        const stiChildClass = target;
        const baseClass = dreamClass['sti'].baseClass || dreamClass;
        if (!Object.getOwnPropertyDescriptor(stiChildClass, 'extendedBy'))
            stiChildClass['extendedBy'] = [];
        if (!Object.getOwnPropertyDescriptor(dreamClass, 'extendedBy'))
            dreamClass['extendedBy'] = [];
        dreamClass['extendedBy'].push(stiChildClass);
        stiChildClass['sti'] = {
            active: true,
            baseClass,
            value: value || stiChildClass.name,
        };
        stiChildClass[exports.STI_SCOPE_NAME] = function (query) {
            return query.where({ type: stiChildClass['sti'].value });
        };
        (0, scope_1.default)({ default: true })(stiChildClass, exports.STI_SCOPE_NAME);
    };
}
exports.default = STI;
