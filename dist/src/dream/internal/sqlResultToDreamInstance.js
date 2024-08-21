"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findExtendingDreamClass = void 0;
const sti_child_missing_1 = __importDefault(require("../../exceptions/sti/sti-child-missing"));
function sqlResultToDreamInstance(dreamClass, sqlResult) {
    if (dreamClass['isSTIBase']) {
        const extendingDreamClass = findExtendingDreamClass(dreamClass, sqlResult.type);
        if (!extendingDreamClass)
            throw new sti_child_missing_1.default(dreamClass, sqlResult.type, sqlResult[dreamClass.primaryKey]);
        return new extendingDreamClass(sqlResult, {
            bypassUserDefinedSetters: true,
            isPersisted: true,
        });
    }
    else {
        return new dreamClass(sqlResult, {
            bypassUserDefinedSetters: true,
            isPersisted: true,
        });
    }
}
exports.default = sqlResultToDreamInstance;
function findExtendingDreamClass(dreamClass, type) {
    if (!dreamClass['extendedBy'])
        return undefined;
    const extendingDreamClass = dreamClass['extendedBy'].find(extendingDreamClass => extendingDreamClass.name === type);
    if (extendingDreamClass)
        return extendingDreamClass;
    return dreamClass['extendedBy']
        .map(extendingDreamClass => findExtendingDreamClass(extendingDreamClass, type))
        .find(dreamClassOrUndefined => dreamClassOrUndefined);
}
exports.findExtendingDreamClass = findExtendingDreamClass;
