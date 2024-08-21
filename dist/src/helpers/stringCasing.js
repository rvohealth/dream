"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const typechecks_1 = require("./typechecks");
const CalendarDate_1 = __importDefault(require("./CalendarDate"));
function stringCase(target, stringCaser) {
    if ((0, typechecks_1.isString)(target))
        return stringCaser(target);
    return recursiveStringCase(target, stringCaser);
}
exports.default = stringCase;
function recursiveStringCase(target, stringCaser) {
    if (target === null)
        return null;
    if (target === undefined)
        return undefined;
    if ((0, typechecks_1.isString)(target))
        return target;
    if (Array.isArray(target))
        return target.map(s => recursiveStringCase(s, stringCaser));
    if ((0, typechecks_1.isObject)(target)) {
        if (target instanceof luxon_1.DateTime)
            return target;
        if (target instanceof CalendarDate_1.default)
            return target;
        if (target?.isDreamInstance)
            return target;
        return Object.keys(target).reduce((stringCasedObject, targetKey) => {
            stringCasedObject[stringCaser(targetKey)] = recursiveStringCase(target[targetKey], stringCaser);
            return stringCasedObject;
        }, {});
    }
    return target;
}
