import {
  CalendarDateDurationLike,
  CalendarDateDurationUnit,
  CalendarDateUnit,
} from '../../types/calendardate.js'
import {
  type DateTimeJSOptions,
  type DateTimeObject,
  type DateTimeOptions,
  type LocaleOptions,
  type WeekdayName,
  type Zone,
} from '../../types/datetime.js'
import { DateTime } from './DateTime.js'

/**
 * CalendarDate represents a date without time or timezone information.
 */
export default class CalendarDate {
  protected readonly dateTime: DateTime

  /**
   * Creates a CalendarDate from a DateTime, year/month/day, or defaults to today in UTC.
   * @param source - DateTime instance, year number, or null/undefined for today
   * @param month - Month (1-12) when source is a year number
   * @param day - Day of month when source is a year number
   * @example
   * ```ts
   * new CalendarDate()                          // today
   * new CalendarDate(DateTime.now())            // from DateTime
   * new CalendarDate(2026, 2, 7)               // February 7, 2026
   * ```
   */
  constructor(source?: DateTime | number | null, month: number = 1, day: number = 1) {
    if (source instanceof DateTime && source.isValid) {
      const isoDate = source.toISODate()
      this.dateTime = DateTime.fromISO(isoDate, { zone: 'UTC' })
    } else if (typeof source === 'number') {
      try {
        this.dateTime = DateTime.utc(source, month, day)
      } catch (error) {
        if (error instanceof Error) throw new InvalidCalendarDate(error)
        throw error
      }
    } else {
      this.dateTime = CalendarDate.today().toDateTime()
    }
  }

  /**
   * Create a CalendarDate from a DateTime instance.
   * @param dateTime - A DateTime instance
   * @returns A CalendarDate for the date portion of the DateTime
   * @example
   * ```ts
   * CalendarDate.fromDateTime(DateTime.now())
   * ```
   */
  public static fromDateTime(dateTime: DateTime): CalendarDate {
    return new CalendarDate(dateTime)
  }

  /**
   * Create a CalendarDate from a JavaScript Date.
   * @param javascriptDate - A JavaScript Date instance
   * @param options - Optional zone to interpret the date in
   * @returns A CalendarDate for the date portion
   * @example
   * ```ts
   * CalendarDate.fromJSDate(new Date())
   * CalendarDate.fromJSDate(new Date(), { zone: 'America/New_York' })
   * ```
   */
  public static fromJSDate(javascriptDate: Date, { zone }: { zone?: string | Zone } = {}): CalendarDate {
    return new CalendarDate(DateTime.fromJSDate(javascriptDate, zone ? { zone } : {}))
  }

  /**
   * Create a CalendarDate from an ISO 8601 date string.
   * @param str - ISO date string (e.g., '2026-02-07')
   * @param options - Optional zone to interpret the date in (only affects ISO strings that include a time component)
   * @returns A CalendarDate for the given date
   * @throws {InvalidCalendarDate} When the ISO string is invalid
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-07')
   * CalendarDate.fromISO('2026-02-07T09:00:00Z')  // time portion ignored
   * ```
   */
  public static fromISO(str: string, { zone }: { zone?: string | Zone } = {}): CalendarDate {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromISO(str, zone ? { zone } : { setZone: true })
    } catch (error) {
      if (error instanceof Error) throw new InvalidCalendarDate(error)
      throw error
    }

    return new CalendarDate(dateTime)
  }

  /**
   * Create a CalendarDate from an SQL date string.
   * @param str - SQL date string (e.g., '2026-02-07')
   * @returns A CalendarDate for the given date
   * @throws {InvalidCalendarDate} When the SQL string is invalid
   * @example
   * ```ts
   * CalendarDate.fromSQL('2026-02-07')
   * ```
   */
  public static fromSQL(str: string): CalendarDate {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromSQL(str, { zone: 'UTC' })
    } catch (error) {
      if (error instanceof Error) throw new InvalidCalendarDate(error)
      throw error
    }

    return new CalendarDate(dateTime)
  }

  /**
   * Create a CalendarDate from a custom format string.
   * Uses Luxon format tokens (e.g., 'MM/dd/yyyy', 'MMMM dd, yyyy').
   * @param text - The string to parse
   * @param format - Format string using Luxon tokens
   * @param options - Optional zone and locale options
   * @returns A CalendarDate for the parsed date
   * @throws {InvalidCalendarDate} When the string doesn't match the format or is invalid
   * @example
   * ```ts
   * CalendarDate.fromFormat('12/15/2017', 'MM/dd/yyyy')
   * CalendarDate.fromFormat('May 25, 1982', 'MMMM dd, yyyy')
   * CalendarDate.fromFormat('mai 25, 1982', 'MMMM dd, yyyy', { locale: 'fr' })
   * ```
   */
  public static fromFormat(text: string, format: string, opts?: DateTimeOptions): CalendarDate {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromFormat(text, format, opts)
    } catch (error) {
      if (error instanceof Error) throw new InvalidCalendarDate(error)
      throw error
    }

    return new CalendarDate(dateTime)
  }

  /**
   * Create a CalendarDate from an object with date units.
   * @param obj - Object with year, month, day properties
   * @param opts - Optional zone/locale options
   * @returns A CalendarDate for the given components
   * @throws {InvalidCalendarDate} When date values are invalid
   * @example
   * ```ts
   * CalendarDate.fromObject({ year: 2026, month: 2, day: 7 })
   * ```
   */
  public static fromObject(obj: DateTimeObject, opts?: DateTimeJSOptions): CalendarDate {
    let dateTime: DateTime

    try {
      dateTime = DateTime.fromObject(obj, opts)
    } catch (error) {
      if (error instanceof Error) throw new InvalidCalendarDate(error)
      throw error
    }

    return new CalendarDate(dateTime)
  }

  /**
   * Returns a CalendarDate for today's date.
   * @param options - Optional zone (defaults to UTC)
   * @returns A CalendarDate for today
   * @example
   * ```ts
   * CalendarDate.today()
   * CalendarDate.today({ zone: 'America/New_York' })
   * ```
   */
  public static today({ zone = 'UTC' }: { zone?: string | Zone } = {}): CalendarDate {
    return new CalendarDate(DateTime.now().setZone(zone))
  }

  /**
   * Returns a CalendarDate for tomorrow's date.
   * @param options - Optional zone (defaults to UTC)
   * @returns A CalendarDate for tomorrow
   * @example
   * ```ts
   * CalendarDate.tomorrow()
   * CalendarDate.tomorrow({ zone: 'America/New_York' })
   * ```
   */
  public static tomorrow(options: { zone?: string | Zone } = {}): CalendarDate {
    return CalendarDate.today(options).plus({ day: 1 })
  }

  /**
   * Returns a CalendarDate for yesterday's date.
   * @param options - Optional zone (defaults to UTC)
   * @returns A CalendarDate for yesterday
   * @example
   * ```ts
   * CalendarDate.yesterday()
   * CalendarDate.yesterday({ zone: 'America/New_York' })
   * ```
   */
  public static yesterday(options: { zone?: string | Zone } = {}): CalendarDate {
    return CalendarDate.today(options).minus({ day: 1 })
  }

  /**
   * Returns the date as an ISO 8601 string.
   * @returns ISO date string (e.g., '2026-02-07')
   * @example
   * ```ts
   * CalendarDate.fromObject({ year: 2026, month: 2, day: 7 }).toISO()  // '2026-02-07'
   * ```
   */
  public toISO(): string {
    return this.dateTime.toISODate()
  }

  /**
   * Returns the date as an SQL date string.
   * @returns SQL date string (e.g., '2026-02-07')
   * @example
   * ```ts
   * CalendarDate.fromObject({ year: 2026, month: 2, day: 7 }).toSQL()  // '2026-02-07'
   * ```
   */
  public toSQL(): string {
    return this.dateTime.toSQLDate()
  }

  /**
   * Returns the date as an ISO string for JSON serialization.
   * @returns ISO date string (e.g., '2026-02-07')
   * @example
   * ```ts
   * JSON.stringify({ date: CalendarDate.today() })
   * ```
   */
  public toJSON() {
    return this.toISO()
  }

  /**
   * Returns the date as an ISO date string (for valueOf() operations).
   * @returns ISO date string (e.g., '2026-02-07')
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-07').valueOf()
   * ```
   */
  public valueOf(): string {
    return this.toISO()
  }

  /**
   * Returns the date as an ISO date string (same as toISO).
   * @returns ISO date string (e.g., '2026-02-07')
   * @example
   * ```ts
   * CalendarDate.fromObject({ year: 2026, month: 2, day: 7 }).toISODate()  // '2026-02-07'
   * ```
   */
  public toISODate() {
    return this.toISO()
  }

  /**
   * Returns a localized string representation of the date.
   * @param formatOpts - Intl.DateTimeFormat options for formatting
   * @param opts - Optional locale options
   * @returns Localized date string
   * @example
   * ```ts
   * CalendarDate.today().toLocaleString()
   * CalendarDate.today().toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' })
   * ```
   */
  public toLocaleString(formatOpts?: Intl.DateTimeFormatOptions, opts?: LocaleOptions): string {
    return this.dateTime.toLocaleString(formatOpts, opts)
  }

  /**
   * Returns the date as an ISO string (same as toISO).
   * @returns ISO date string (e.g., '2026-02-07')
   * @example
   * ```ts
   * String(CalendarDate.today())
   * ```
   */
  public toString() {
    return this.toISO()
  }

  /**
   * Returns the underlying DateTime instance (at midnight UTC).
   * @returns A DateTime representing this date at 00:00:00 UTC
   * @example
   * ```ts
   * const dt = CalendarDate.today().toDateTime()
   * ```
   */
  public toDateTime(): DateTime {
    return this.dateTime
  }

  /**
   * Returns a JavaScript Date for this date (at midnight UTC).
   * @returns A JavaScript Date instance
   * @example
   * ```ts
   * const jsDate = CalendarDate.today().toJSDate()
   * ```
   */
  public toJSDate(): Date {
    return this.dateTime.toJSDate()
  }

  /**
   * Gets the year.
   * @returns The year number
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-07').year  // 2026
   * ```
   */
  public get year(): number {
    return this.dateTime.year
  }

  /**
   * Gets the month (1-12).
   * @returns The month number (1 = January, 12 = December)
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-07').month  // 2
   * ```
   */
  public get month(): number {
    return this.dateTime.month
  }

  /**
   * Gets the day of the month.
   * @returns The day number (1-31)
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-07').day  // 7
   * ```
   */
  public get day(): number {
    return this.dateTime.day
  }

  /**
   * Returns the lowercase name of the weekday.
   * @returns Weekday name: 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', or 'sunday'
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-09').weekdayName  // 'monday' (Feb 9, 2026 is a Monday)
   * CalendarDate.fromISO('2026-02-07').weekdayName  // 'saturday'
   * ```
   */
  public get weekdayName(): WeekdayName {
    return this.dateTime.weekdayName
  }

  /**
   * Returns a new CalendarDate at the start of the given period.
   * @param period - Unit to truncate to ('year', 'quarter', 'month', 'week', or 'day')
   * @returns A CalendarDate at the start of the period
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-15').startOf('month')  // 2026-02-01
   * CalendarDate.fromISO('2026-02-15').startOf('year')   // 2026-01-01
   * ```
   */
  public startOf(period: CalendarDateUnit): CalendarDate {
    return new CalendarDate(this.dateTime.startOf(period))
  }

  /**
   * Returns a new CalendarDate at the end of the given period.
   * @param period - Unit to extend to end of ('year', 'quarter', 'month', 'week', or 'day')
   * @returns A CalendarDate at the end of the period
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-15').endOf('month')  // 2026-02-28
   * CalendarDate.fromISO('2026-02-15').endOf('year')   // 2026-12-31
   * ```
   */
  public endOf(period: CalendarDateUnit): CalendarDate {
    return new CalendarDate(this.dateTime.endOf(period))
  }

  /**
   * Returns a new CalendarDate with the given duration added.
   * @param duration - Duration to add (object with years, months, weeks, days, etc.)
   * @returns A new CalendarDate
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-07').plus({ days: 5 })    // 2026-02-12
   * CalendarDate.fromISO('2026-02-07').plus({ months: 2 })  // 2026-04-07
   * ```
   */
  public plus(duration: CalendarDateDurationLike): CalendarDate {
    return new CalendarDate(this.dateTime.plus(duration))
  }

  /**
   * Returns a new CalendarDate with the given duration subtracted.
   * @param duration - Duration to subtract (object with years, months, weeks, days, etc.)
   * @returns A new CalendarDate
   * @example
   * ```ts
   * CalendarDate.fromISO('2026-02-07').minus({ days: 5 })    // 2026-02-02
   * CalendarDate.fromISO('2026-02-07').minus({ months: 2 })  // 2025-12-07
   * ```
   */
  public minus(duration: CalendarDateDurationLike): CalendarDate {
    return new CalendarDate(this.dateTime.minus(duration))
  }

  /**
   * Returns the earliest CalendarDate from the given arguments.
   * @param calendarDates - CalendarDates to compare
   * @returns The earliest CalendarDate
   * @example
   * ```ts
   * CalendarDate.min(date1, date2, date3)
   * ```
   */
  public static min(...calendarDates: Array<CalendarDate>): CalendarDate | null {
    if (calendarDates.length === 0) return null
    return calendarDates.reduce((best, dt) => (dt.valueOf() < best.valueOf() ? dt : best), calendarDates[0]!)
  }

  /**
   * Returns the latest CalendarDate from the given arguments.
   * @param calendarDates - CalendarDates to compare
   * @returns The latest CalendarDate
   * @example
   * ```ts
   * CalendarDate.max(date1, date2, date3)
   * ```
   */
  public static max(...calendarDates: Array<CalendarDate>): CalendarDate | null {
    if (calendarDates.length === 0) return null
    return calendarDates.reduce((best, dt) => (dt.valueOf() > best.valueOf() ? dt : best), calendarDates[0]!)
  }

  /**
   * Returns true if this and other are in the same unit of time.
   * @param otherCalendarDate - CalendarDate to compare against
   * @param period - Unit to check ('year', 'quarter', 'month', 'week', or 'day')
   * @returns true if same period
   * @example
   * ```ts
   * const d1 = CalendarDate.fromISO('2026-02-07')
   * const d2 = CalendarDate.fromISO('2026-02-15')
   * d1.hasSame(d2, 'month')  // true
   * d1.hasSame(d2, 'day')    // false
   * ```
   */
  public hasSame(otherCalendarDate: CalendarDate, period: CalendarDateUnit): boolean {
    const otherDateTime = otherCalendarDate.toDateTime()
    if (otherDateTime === null) return false
    return this.dateTime.hasSame(otherDateTime, period)
  }

  /**
   * Returns the difference between this CalendarDate and another in the specified unit.
   * @param otherCalendarDate - CalendarDate to compare against
   * @param duration - Unit for the difference ('years', 'weeks', or 'days')
   * @returns Numeric difference in the specified unit
   * @example
   * ```ts
   * const d1 = CalendarDate.fromISO('2026-02-07')
   * const d2 = CalendarDate.fromISO('2026-02-15')
   * d2.diff(d1, 'days')    // 8
   * ```
   */
  public diff(otherCalendarDate: CalendarDate, duration: CalendarDateDurationUnit): number {
    const otherDateTime = otherCalendarDate.toDateTime()
    const result = this.dateTime.diff(otherDateTime, duration) as Record<string, number>
    return result[duration] ?? 0
  }

  /**
   * Returns the difference between this CalendarDate and today in the specified unit.
   * @param duration - Unit for the difference ('years', 'weeks', or 'days')
   * @returns Numeric difference in the specified unit (rounded up)
   * @example
   * ```ts
   * const future = CalendarDate.today().plus({ days: 5 })
   * future.diffNow('days')  // approximately 5
   * ```
   */
  public diffNow(duration: CalendarDateDurationUnit): number {
    const result = this.dateTime.diffNow(duration) as Record<string, number>
    return Math.ceil(result[duration] ?? 0)
  }

  /**
   * Returns true if this CalendarDate equals another CalendarDate.
   * @param otherCalendarDate - CalendarDate to compare
   * @returns true if dates are equal
   * @example
   * ```ts
   * const d1 = CalendarDate.fromISO('2026-02-07')
   * const d2 = CalendarDate.fromISO('2026-02-07')
   * d1.equals(d2)  // true
   * ```
   */
  public equals(otherCalendarDate: CalendarDate): boolean {
    return this.dateTime.equals(otherCalendarDate.toDateTime())
  }
}

/**
 * Thrown when a CalendarDate is invalid (e.g., invalid input or date values).
 * @param error - The original error (available as cause)
 * @example
 * ```ts
 * try {
 *   CalendarDate.fromISO('invalid')
 * } catch (e) {
 *   if (e instanceof InvalidCalendarDate) console.error(e.message)
 * }
 * ```
 */
export class InvalidCalendarDate extends Error {
  constructor(error: Error) {
    super((error.message ?? '').replace('DateTime', 'CalendarDate'))
  }
}
