import { DateObjectUnits, DateTime, DateTimeFormatOptions, DateTimeJSOptions, DateTimeUnit, DurationLikeObject, DurationObjectUnits, LocaleOptions, Zone } from 'luxon';
type CalendarDateDurationLike = Pick<DurationLikeObject, 'year' | 'years' | 'quarter' | 'quarters' | 'month' | 'months' | 'week' | 'weeks' | 'day' | 'days'>;
type CalendarDateDurationUnit = keyof Pick<DurationObjectUnits, 'years' | 'quarters' | 'months' | 'weeks' | 'days'>;
type CalendarDateUnit = Extract<DateTimeUnit, 'year' | 'quarter' | 'month' | 'week' | 'day'>;
export default class CalendarDate {
    private luxonDateTime;
    constructor(source: DateTime | number | null, month?: number, day?: number);
    static fromDateTime(dateTime: DateTime): CalendarDate;
    static fromJSDate(javascriptDate: Date, { zone }?: {
        zone?: string | Zone;
    }): CalendarDate;
    static newInvalidDate(): CalendarDate;
    static fromISO(str: string, { zone }?: {
        zone?: string | Zone;
    }): CalendarDate;
    static fromObject(obj: DateObjectUnits, opts?: DateTimeJSOptions): CalendarDate;
    static today({ zone }?: {
        zone?: string | Zone;
    }): CalendarDate;
    static tomorrow(options?: {
        zone?: string | Zone;
    }): CalendarDate;
    static yesterday(options?: {
        zone?: string | Zone;
    }): CalendarDate;
    get isValid(): boolean;
    toISO(): string | null;
    toJSON(): string | null;
    valueOf(): string | null;
    toISODate(): string | null;
    toLocaleString(formatOpts?: DateTimeFormatOptions, opts?: LocaleOptions): string | null;
    toString(): string | null;
    toDateTime(): DateTime | null;
    toJSDate(): Date | null;
    get year(): number | null;
    get month(): number | null;
    get day(): number | null;
    startOf(period: CalendarDateUnit): CalendarDate;
    endOf(period: CalendarDateUnit): CalendarDate;
    plus(duration: CalendarDateDurationLike): CalendarDate;
    minus(duration: CalendarDateDurationLike): CalendarDate;
    static max(calendarDate: CalendarDate, otherCalendarDate: CalendarDate): CalendarDate;
    static min(calendarDate: CalendarDate, otherCalendarDate: CalendarDate): CalendarDate;
    hasSame(otherCalendarDate: CalendarDate, period: CalendarDateUnit): boolean;
    diff(otherCalendarDate: CalendarDate, duration: CalendarDateDurationUnit): number | null;
    diffNow(duration: CalendarDateDurationUnit): number | null;
    equals(otherCalendarDate: CalendarDate): boolean;
}
export {};
