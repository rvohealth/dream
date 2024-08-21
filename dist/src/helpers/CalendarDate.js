"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
class CalendarDate {
    constructor(source, month = 1, day = 1) {
        if (source instanceof luxon_1.DateTime && source.isValid) {
            const isoDate = source.toISODate();
            this.luxonDateTime = luxon_1.DateTime.fromISO(isoDate, { zone: 'UTC' });
        }
        else if (typeof source === 'number') {
            const dateTime = luxon_1.DateTime.utc(source, month, day);
            this.luxonDateTime = dateTime.isValid ? dateTime : null;
        }
        else {
            this.luxonDateTime = null;
        }
    }
    static fromDateTime(dateTime) {
        return new CalendarDate(dateTime);
    }
    static fromJSDate(javascriptDate, { zone } = {}) {
        return new CalendarDate(luxon_1.DateTime.fromJSDate(javascriptDate, { zone }));
    }
    static newInvalidDate() {
        return new CalendarDate(null);
    }
    static fromISO(str, { zone } = {}) {
        if (zone)
            return new CalendarDate(luxon_1.DateTime.fromISO(str, { zone }));
        else
            return new CalendarDate(luxon_1.DateTime.fromISO(str, { setZone: true }));
    }
    static fromObject(obj, opts) {
        return new CalendarDate(luxon_1.DateTime.fromObject(obj, opts));
    }
    static today({ zone = 'UTC' } = {}) {
        return new CalendarDate(luxon_1.DateTime.now().setZone(zone));
    }
    static tomorrow(options = {}) {
        return CalendarDate.today(options).plus({ day: 1 });
    }
    static yesterday(options = {}) {
        return CalendarDate.today(options).minus({ day: 1 });
    }
    get isValid() {
        if (this.luxonDateTime === null)
            return false;
        return this.luxonDateTime.isValid;
    }
    toISO() {
        if (this.luxonDateTime === null)
            return null;
        return this.luxonDateTime.toISODate();
    }
    toJSON() {
        return this.toISO();
    }
    valueOf() {
        return this.toISO();
    }
    toISODate() {
        return this.toISO();
    }
    toLocaleString(formatOpts, opts) {
        if (this.luxonDateTime === null)
            return null;
        return this.luxonDateTime.toLocaleString(formatOpts, opts);
    }
    toString() {
        return this.toISO();
    }
    toDateTime() {
        return this.luxonDateTime;
    }
    toJSDate() {
        if (this.luxonDateTime === null)
            return null;
        return this.luxonDateTime.toJSDate();
    }
    get year() {
        if (this.luxonDateTime === null)
            return null;
        return this.luxonDateTime.year;
    }
    get month() {
        if (this.luxonDateTime === null)
            return null;
        return this.luxonDateTime.month;
    }
    get day() {
        if (this.luxonDateTime === null)
            return null;
        return this.luxonDateTime.day;
    }
    startOf(period) {
        if (this.luxonDateTime === null)
            return CalendarDate.newInvalidDate();
        return new CalendarDate(this.luxonDateTime.startOf(period));
    }
    endOf(period) {
        if (this.luxonDateTime === null)
            return CalendarDate.newInvalidDate();
        return new CalendarDate(this.luxonDateTime.endOf(period));
    }
    plus(duration) {
        if (this.luxonDateTime === null)
            return CalendarDate.newInvalidDate();
        return new CalendarDate(this.luxonDateTime.plus(duration));
    }
    minus(duration) {
        if (this.luxonDateTime === null)
            return CalendarDate.newInvalidDate();
        return new CalendarDate(this.luxonDateTime.minus(duration));
    }
    static max(calendarDate, otherCalendarDate) {
        const dateTime = calendarDate.toDateTime();
        if (dateTime === null)
            return CalendarDate.newInvalidDate();
        const otherDateTime = otherCalendarDate.toDateTime();
        if (otherDateTime === null)
            return CalendarDate.newInvalidDate();
        return new CalendarDate(luxon_1.DateTime.max(dateTime, otherDateTime));
    }
    static min(calendarDate, otherCalendarDate) {
        const dateTime = calendarDate.toDateTime();
        if (dateTime === null)
            return CalendarDate.newInvalidDate();
        const otherDateTime = otherCalendarDate.toDateTime();
        if (otherDateTime === null)
            return CalendarDate.newInvalidDate();
        return new CalendarDate(luxon_1.DateTime.min(dateTime, otherDateTime));
    }
    hasSame(otherCalendarDate, period) {
        if (this.luxonDateTime === null)
            return false;
        const otherDateTime = otherCalendarDate.toDateTime();
        if (otherDateTime === null)
            return false;
        return this.luxonDateTime.hasSame(otherDateTime, period);
    }
    diff(otherCalendarDate, duration) {
        if (this.luxonDateTime === null)
            return null;
        const otherDateTime = otherCalendarDate.toDateTime();
        if (otherDateTime === null)
            return null;
        return this.luxonDateTime.diff(otherDateTime, duration)[duration];
    }
    diffNow(duration) {
        if (this.luxonDateTime === null)
            return null;
        return Math.ceil(this.luxonDateTime.diffNow(duration)[duration]);
    }
    equals(otherCalendarDate) {
        if (this.luxonDateTime === null)
            return otherCalendarDate.toDateTime() === null;
        const otherDateTime = otherCalendarDate.toDateTime();
        if (otherDateTime === null)
            return this.luxonDateTime === null;
        return this.luxonDateTime.equals(otherDateTime);
    }
}
exports.default = CalendarDate;
