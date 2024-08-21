"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marshalDBValue = void 0;
const luxon_1 = require("luxon");
const CalendarDate_1 = __importDefault(require("./CalendarDate"));
const isDatabaseArrayColumn_1 = __importDefault(require("./db/types/isDatabaseArrayColumn"));
const isDateColumn_1 = __importDefault(require("./db/types/isDateColumn"));
const isDateTimeColumn_1 = __importDefault(require("./db/types/isDateTimeColumn"));
const isDecimalColumn_1 = __importDefault(require("./db/types/isDecimalColumn"));
const marshalDBArrayValue_1 = __importDefault(require("./marshalDBArrayValue"));
function marshalDBValue(dreamClass, column, value) {
    if (value !== null && value !== undefined && (0, isDecimalColumn_1.default)(dreamClass, column))
        return parseFloat(value);
    if (value instanceof Date) {
        if ((0, isDateTimeColumn_1.default)(dreamClass, column)) {
            return luxon_1.DateTime.fromJSDate(value, { zone: 'UTC' });
        }
        else if ((0, isDateColumn_1.default)(dreamClass, column)) {
            const dateString = value.toISOString().split('T')[0];
            return CalendarDate_1.default.fromISO(dateString, { zone: 'UTC' });
        }
        else {
            throw new Error(`marshalDBValue() received Javascript Date, but isDateTimeColumn and isDateColumn
return false for column '${column.toString()}' on '${dreamClass.name}'`);
        }
    }
    if (typeof value === 'string' && (0, isDateTimeColumn_1.default)(dreamClass, column)) {
        return luxon_1.DateTime.fromISO(value, { zone: 'UTC' });
    }
    else if (typeof value === 'string' && (0, isDateColumn_1.default)(dreamClass, column)) {
        return CalendarDate_1.default.fromISO(value, { zone: 'UTC' });
    }
    if ((0, isDatabaseArrayColumn_1.default)(dreamClass, column)) {
        return (0, marshalDBArrayValue_1.default)(dreamClass, value);
    }
    return value;
}
exports.marshalDBValue = marshalDBValue;
