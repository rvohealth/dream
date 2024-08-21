"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const CalendarDate_1 = __importDefault(require("./CalendarDate"));
function sqlAttributes(dream) {
    const attributes = dream.dirtyAttributes();
    return Object.keys(attributes).reduce((result, key) => {
        const val = attributes[key];
        if (val instanceof luxon_1.DateTime || val instanceof CalendarDate_1.default) {
            // Converting toJSDate resulted in the correct timezone, but even with process.env.TZ=UTC,
            // Kysely inserted into the database with the machine timezone, which can shift the date
            // (e.g., toJSDate resulted in a JS Date that formats as "1987-04-07T00:00:00.000Z", but
            // Kysely inserted "1907-04-06"  into the database). By converting to an ISO string before
            // handing off to Kysely, we bypass Javascript dates altogether, sending the string into the
            // database for storage as a date or datetime.
            result[key] = val.toISO();
        }
        else if (val !== undefined) {
            result[key] = val;
        }
        return result;
    }, {});
}
exports.default = sqlAttributes;
