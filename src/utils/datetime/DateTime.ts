import { DateTime as LuxonDateTime, Settings as LuxonSettings } from 'luxon'
import round from '../../helpers/round.js'
import {
  DateTimeJSOptions,
  DateTimeObject,
  DateTimeOptions,
  DateTimeUnit,
  DiffResult,
  DurationLikeObject,
  DurationUnit,
  LocaleOptions,
  ToISOTimeOptions,
  WeekdayName,
  Zone,
} from '../../types/datetime.js'
import { microsecondParts } from './helpers/microsecondParts.js'
import replaceISOMicroseconds from './helpers/replaceISOMicroseconds.js'

export const Settings = LuxonSettings
Settings.throwOnInvalid = true

export const BASE_DATE_OBJECT = {
  year: 2000,
  month: 1,
  day: 1,
}

/**
 * DateTime wraps Luxon DateTime with microsecond precision (0-999).
 * The decimal part in ISO/SQL is 6 digits: first 3 = milliseconds, next 3 = microseconds.
 *
 * Full datetime output (toISO, toSQL) is normalized to UTC.
 * Time-only output (toISOTime, toSQLTime) omits timezone offset by default.
 */
export class DateTime {
  protected readonly luxonDatetime: LuxonDateTime
  protected readonly _microseconds: number

  /**
   * Microsecond part of the DateTime (NOT microseconds since Unix epoch)
   *
   * This value will not exceed 999 because above that will carry over to the
   * millisecond part of the DateTime
   *
   * @returns The microsecond of the second (0–999)
   */
  public get microsecond(): number {
    return this._microseconds
  }

  // Proxied Luxon getters
  public get year(): number {
    return this.luxonDatetime.year
  }

  public get month(): number {
    return this.luxonDatetime.month
  }

  public get day(): number {
    return this.luxonDatetime.day
  }

  public get hour(): number {
    return this.luxonDatetime.hour
  }

  public get minute(): number {
    return this.luxonDatetime.minute
  }

  public get second(): number {
    return this.luxonDatetime.second
  }

  public get millisecond(): number {
    return this.luxonDatetime.millisecond
  }

  public get weekday(): number {
    return this.luxonDatetime.weekday
  }

  /**
   * Returns the lowercase name of the weekday.
   * @returns Weekday name: 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', or 'sunday'
   * @example
   * ```ts
   * DateTime.fromISO('2026-02-09T09:00:00Z').weekdayName  // 'monday' (Feb 9, 2026 is a Monday)
   * DateTime.fromISO('2026-02-07T09:00:00Z').weekdayName  // 'saturday'
   * ```
   */
  public get weekdayName(): WeekdayName {
    const weekdayNumber = this.luxonDatetime.weekday // 1 (Monday) to 7 (Sunday)
    const weekdayNames: WeekdayName[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]
    return weekdayNames[weekdayNumber - 1]!
  }

  public get weekNumber(): number {
    return this.luxonDatetime.weekNumber
  }

  public get weekYear(): number {
    return this.luxonDatetime.weekYear
  }

  public get ordinal(): number {
    return this.luxonDatetime.ordinal
  }

  public get quarter(): number {
    return this.luxonDatetime.quarter
  }

  public get zoneName(): string {
    return this.luxonDatetime.zoneName
  }

  public get offset(): number {
    return this.luxonDatetime.offset
  }

  public get invalidReason(): string | null {
    return this.luxonDatetime.invalidReason
  }

  public get invalidExplanation(): string | null {
    return this.luxonDatetime.invalidExplanation
  }

  public get locale(): string {
    return this.luxonDatetime.locale
  }

  public get zone(): Zone {
    return this.luxonDatetime.zone
  }

  protected constructor(luxonDatetime: LuxonDateTime, microseconds: number = 0) {
    this.luxonDatetime = luxonDatetime
    this._microseconds = microseconds
  }

  /**
   * Returns the underlying Luxon DateTime instance.
   * Since Luxon is immutable, it is safe to return the actual object.
   * @returns The Luxon DateTime instance
   * @example
   * ```ts
   * const dt = DateTime.now()
   * const luxon = dt.toLuxon()
   * ```
   */
  public toLuxon(): LuxonDateTime {
    return this.luxonDatetime
  }

  /**
   * Returns the current time in the system's local zone.
   * @returns A DateTime for the current instant
   * @example
   * ```ts
   * const now = DateTime.now()
   * ```
   */
  public static now(): DateTime {
    return new DateTime(LuxonDateTime.now(), 0)
  }

  // Format presets for toLocaleString()

  /**
   * {@link DateTime.toLocaleString} format like 10/14/1983
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATE_SHORT)
   * ```
   */
  public static get DATE_SHORT(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATE_SHORT
  }

  /**
   * {@link DateTime.toLocaleString} format like 'Oct 14, 1983'
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATE_MED)
   * ```
   */
  public static get DATE_MED(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATE_MED
  }

  /**
   * {@link DateTime.toLocaleString} format like 'Fri, Oct 14, 1983'
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
   * ```
   */
  public static get DATE_MED_WITH_WEEKDAY(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATE_MED_WITH_WEEKDAY
  }

  /**
   * {@link DateTime.toLocaleString} format like 'October 14, 1983'
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATE_FULL)
   * ```
   */
  public static get DATE_FULL(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATE_FULL
  }

  /**
   * {@link DateTime.toLocaleString} format like 'Tuesday, October 14, 1983'
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATE_HUGE)
   * ```
   */
  public static get DATE_HUGE(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATE_HUGE
  }

  /**
   * {@link DateTime.toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)
   * ```
   */
  public static get TIME_SIMPLE(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.TIME_SIMPLE
  }

  /**
   * {@link DateTime.toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.TIME_WITH_SECONDS)
   * ```
   */
  public static get TIME_WITH_SECONDS(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.TIME_WITH_SECONDS
  }

  /**
   * {@link DateTime.toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET)
   * ```
   */
  public static get TIME_WITH_SHORT_OFFSET(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.TIME_WITH_SHORT_OFFSET
  }

  /**
   * {@link DateTime.toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.TIME_WITH_LONG_OFFSET)
   * ```
   */
  public static get TIME_WITH_LONG_OFFSET(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.TIME_WITH_LONG_OFFSET
  }

  /**
   * {@link DateTime.toLocaleString} format like '09:30', always 24-hour.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.TIME_24_SIMPLE)
   * ```
   */
  public static get TIME_24_SIMPLE(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.TIME_24_SIMPLE
  }

  /**
   * {@link DateTime.toLocaleString} format like '09:30:23', always 24-hour.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.TIME_24_WITH_SECONDS)
   * ```
   */
  public static get TIME_24_WITH_SECONDS(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.TIME_24_WITH_SECONDS
  }

  /**
   * {@link DateTime.toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.TIME_24_WITH_SHORT_OFFSET)
   * ```
   */
  public static get TIME_24_WITH_SHORT_OFFSET(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.TIME_24_WITH_SHORT_OFFSET
  }

  /**
   * {@link DateTime.toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.TIME_24_WITH_LONG_OFFSET)
   * ```
   */
  public static get TIME_24_WITH_LONG_OFFSET(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.TIME_24_WITH_LONG_OFFSET
  }

  /**
   * {@link DateTime.toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_SHORT)
   * ```
   */
  public static get DATETIME_SHORT(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_SHORT
  }

  /**
   * {@link DateTime.toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
   * ```
   */
  public static get DATETIME_SHORT_WITH_SECONDS(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_SHORT_WITH_SECONDS
  }

  /**
   * {@link DateTime.toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_MED)
   * ```
   */
  public static get DATETIME_MED(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_MED
  }

  /**
   * {@link DateTime.toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)
   * ```
   */
  public static get DATETIME_MED_WITH_SECONDS(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_MED_WITH_SECONDS
  }

  /**
   * {@link DateTime.toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
   * ```
   */
  public static get DATETIME_MED_WITH_WEEKDAY(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_MED_WITH_WEEKDAY
  }

  /**
   * {@link DateTime.toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_FULL)
   * ```
   */
  public static get DATETIME_FULL(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_FULL
  }

  /**
   * {@link DateTime.toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)
   * ```
   */
  public static get DATETIME_FULL_WITH_SECONDS(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_FULL_WITH_SECONDS
  }

  /**
   * {@link DateTime.toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_HUGE)
   * ```
   */
  public static get DATETIME_HUGE(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_HUGE
  }

  /**
   * {@link DateTime.toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @example
   * ```ts
   * DateTime.now().toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS)
   * ```
   */
  public static get DATETIME_HUGE_WITH_SECONDS(): Intl.DateTimeFormatOptions {
    return LuxonDateTime.DATETIME_HUGE_WITH_SECONDS
  }

  /**
   * Create a local DateTime. Accepts the same overloads as Luxon plus an optional microsecond (8th numeric arg).
   * The last argument may be an options object instead of a time component.
   * @param yearOrOpts - Year, or options object when called with no args or opts only
   * @param month - Month (1–12)
   * @param day - Day of month
   * @param hour - Hour (0–23)
   * @param minute - Minute (0–59)
   * @param second - Second (0–59)
   * @param millisecond - Millisecond (0–999)
   * @param microsecondOrOpts - Microsecond (0–999) or options object
   * @param opts - Optional configuration
   * @param opts.zone - Timezone (IANA timezone name or Zone object, defaults to local)
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns A DateTime in the local zone
   * @example
   * ```ts
   * DateTime.local()                                    // now
   * DateTime.local(2017, 3, 12)                         // 2017-03-12T00:00:00
   * DateTime.local(2017, 3, 12, 10, 30, 45)            // 2017-03-12T10:30:45
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456)  // with millisecond 123 and microsecond 456
   * DateTime.local(2017, 3, 12, { zone: 'America/New_York' })  // with zone option
   * ```
   */
  public static local(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    microsecond: number,
    opts?: DateTimeJSOptions
  ): DateTime
  static local(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    opts?: DateTimeJSOptions
  ): DateTime
  public static local(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    opts?: DateTimeJSOptions
  ): DateTime
  public static local(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    opts?: DateTimeJSOptions
  ): DateTime
  public static local(
    year: number,
    month: number,
    day: number,
    hour: number,
    opts?: DateTimeJSOptions
  ): DateTime
  public static local(year: number, month: number, day: number, opts?: DateTimeJSOptions): DateTime
  public static local(year: number, month: number, opts?: DateTimeJSOptions): DateTime
  public static local(year: number, opts?: DateTimeJSOptions): DateTime
  public static local(opts?: DateTimeJSOptions): DateTime
  public static local(
    yearOrOpts?: number | DateTimeJSOptions,
    month?: number | DateTimeJSOptions,
    day?: number | DateTimeJSOptions,
    hour?: number | DateTimeJSOptions,
    minute?: number | DateTimeJSOptions,
    second?: number | DateTimeJSOptions,
    millisecond?: number | DateTimeJSOptions,
    microsecondOrOpts?: number | DateTimeJSOptions,
    opts?: DateTimeJSOptions
  ): DateTime {
    const isOpts = (v: unknown): v is DateTimeJSOptions => typeof v === 'object' && v !== null
    const { luxonDatetime, microseconds } = buildLocalOrUtcDateTime(
      yearOrOpts,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecondOrOpts,
      opts,
      isOpts,
      (y, m, d, h, mi, s, ms, opts) =>
        LuxonDateTime.local(y, m, d, h, mi, s, ms, opts as luxon.DateTimeJSOptions)
    )
    return new DateTime(luxonDatetime, microseconds)
  }

  /**
   * Create a UTC DateTime. Accepts the same overloads as Luxon plus an optional microsecond (8th numeric arg).
   * The last argument may be an options object instead of a time component.
   * @param yearOrOpts - Year, or options object when called with no args or opts only
   * @param month - Month (1–12)
   * @param day - Day of month
   * @param hour - Hour (0–23)
   * @param minute - Minute (0–59)
   * @param second - Second (0–59)
   * @param millisecond - Millisecond (0–999)
   * @param microsecondOrOpts - Microsecond (0–999) or options object
   * @param opts - Options (locale, etc.)
   * @returns A DateTime in UTC
   * @example
   * ```ts
   * DateTime.utc()                                      // now in UTC
   * DateTime.utc(2017, 3, 12, 5, 45, 10, 765, 123)     // with microsecond
   * DateTime.utc(2017, 3, 12, { locale: 'fr' })        // with options
   * ```
   */
  public static utc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    microsecond: number,
    opts?: LocaleOptions
  ): DateTime
  public static utc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    opts?: LocaleOptions
  ): DateTime
  public static utc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    opts?: LocaleOptions
  ): DateTime
  public static utc(year: number, month: number, day: number, hour: number, opts?: LocaleOptions): DateTime
  public static utc(year: number, month: number, day: number, opts?: LocaleOptions): DateTime
  public static utc(year: number, month: number, opts?: LocaleOptions): DateTime
  public static utc(year: number, opts?: LocaleOptions): DateTime
  public static utc(opts?: LocaleOptions): DateTime
  public static utc(
    yearOrOpts?: number | LocaleOptions,
    month?: number | LocaleOptions,
    day?: number | LocaleOptions,
    hour?: number | LocaleOptions,
    minute?: number | LocaleOptions,
    second?: number | LocaleOptions,
    millisecond?: number | LocaleOptions,
    microsecondOrOpts?: number | LocaleOptions,
    opts?: LocaleOptions
  ): DateTime {
    const isOpts = (v: unknown): v is LocaleOptions => typeof v === 'object' && v !== null
    const { luxonDatetime, microseconds } = buildLocalOrUtcDateTime(
      yearOrOpts,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecondOrOpts,
      opts,
      isOpts,
      (y, m, d, h, mi, s, ms, opts) => LuxonDateTime.utc(y, m, d, h, mi, s, ms, opts as luxon.LocaleOptions)
    )
    return new DateTime(luxonDatetime, microseconds)
  }

  /**
   * Create a DateTime from a JavaScript Date.
   * @param date - A JavaScript Date instance
   * @param opts - Optional configuration
   * @param opts.zone - Timezone for the result (IANA timezone name or Zone object)
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns A DateTime representing the same instant
   * @example
   * ```ts
   * DateTime.fromJSDate(new Date())
   * DateTime.fromJSDate(new Date(), { zone: 'America/New_York' })
   * ```
   */
  public static fromJSDate(date: Date, opts?: DateTimeJSOptions): DateTime {
    const luxonDatetime = opts
      ? // @ts-expect-error - exactOptionalPropertyTypes incompatibility with Luxon types
        LuxonDateTime.fromJSDate(date, opts)
      : LuxonDateTime.fromJSDate(date)
    return new DateTime(luxonDatetime, 0)
  }

  /**
   * Create a DateTime from epoch milliseconds.
   * @param millisecondInput - Unix timestamp in milliseconds (fractional part becomes microseconds)
   * @param opts - Optional configuration
   * @param opts.zone - Timezone for the result (IANA timezone name or Zone object)
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns A DateTime for the given instant
   * @example
   * ```ts
   * DateTime.fromMillis(1707234567890)
   * DateTime.fromMillis(1707234567890.123) // .123 ms = 123 microseconds
   * DateTime.fromMillis(1707234567890, { zone: 'America/New_York' })
   * ```
   */
  public static fromMillis(millisecondInput: number, opts?: DateTimeJSOptions): DateTime {
    const { milliseconds, microseconds } = microsecondParts(millisecondInput * 1000, {
      errorIfNegative: false,
    })

    return new DateTime(LuxonDateTime.fromMillis(milliseconds, opts as luxon.DateTimeJSOptions), microseconds)
  }

  /**
   * Create a DateTime from epoch microseconds.
   * @param microseconds - Unix timestamp in microseconds (milliseconds from quotient, microsecond from remainder)
   * @param opts - Optional configuration
   * @param opts.zone - Timezone for the result (IANA timezone name or Zone object)
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns A DateTime for the given instant
   * @example
   * ```ts
   * DateTime.fromMicroseconds(1707234567890123)
   * DateTime.fromMicroseconds(1707234567890123, { zone: 'America/New_York' })
   * ```
   */
  public static fromMicroseconds(microsecondsInput: number, opts?: DateTimeJSOptions): DateTime {
    const { milliseconds, microseconds } = microsecondParts(microsecondsInput)
    const luxonDatetime = LuxonDateTime.fromMillis(milliseconds, opts as luxon.DateTimeJSOptions)
    return new DateTime(luxonDatetime, microseconds)
  }

  /**
   * Create a DateTime from epoch seconds.
   * Fractional seconds are converted to milliseconds and microseconds.
   * @param seconds - Unix timestamp in seconds (fractional part becomes ms + µs)
   * @param opts - Optional configuration
   * @param opts.zone - Timezone for the result (IANA timezone name or Zone object)
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns A DateTime for the given instant
   * @example
   * ```ts
   * DateTime.fromSeconds(1707234567)
   * DateTime.fromSeconds(1707234567.123456) // .123456 seconds = 123ms + 456µs
   * DateTime.fromSeconds(1707234567, { zone: 'America/New_York' })
   * ```
   */
  public static fromSeconds(seconds: number, opts?: DateTimeJSOptions): DateTime {
    // Convert seconds to microseconds to preserve full precision
    const totalMicroseconds = seconds * 1_000_000
    const { milliseconds, microseconds } = microsecondParts(totalMicroseconds, { errorIfNegative: false })

    const luxonDatetime = LuxonDateTime.fromMillis(milliseconds, opts as luxon.DateTimeJSOptions)
    return new DateTime(luxonDatetime, microseconds)
  }

  /**
   * Create a DateTime from an object with date/time units.
   * Fractional milliseconds are converted to microseconds (e.g., 1.5 ms = 1 ms + 500 µs).
   * @param obj - Object with year, month, day, hour, minute, second, millisecond, microsecond
   * @param opts - Optional configuration
   * @param opts.zone - Timezone for the datetime (IANA timezone name or Zone object)
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns A DateTime for the given components
   * @example
   * ```ts
   * DateTime.fromObject({ year: 2017, month: 3, day: 12, hour: 5, minute: 45, microsecond: 123 })
   * DateTime.fromObject({ year: 2017, month: 3, day: 12, millisecond: 1.5 }) // 1ms + 500µs
   * DateTime.fromObject({ year: 2017, month: 3, day: 12 }, { zone: 'America/New_York' })
   * ```
   */
  public static fromObject(obj: DateTimeObject, opts?: DateTimeJSOptions): DateTime {
    const { microsecond, millisecond, ...rest } = obj
    let microsecondsTotal = microsecond ?? 0

    // Handle fractional milliseconds by converting to microseconds
    let adjustedMillisecond = millisecond
    if (millisecond !== undefined) {
      const wholeMilli = Math.floor(millisecond)
      const fractionalMilli = millisecond - wholeMilli
      microsecondsTotal += Math.round(fractionalMilli * 1000)
      adjustedMillisecond = wholeMilli
    }

    const { milliseconds, microseconds } = microsecondParts(microsecondsTotal)
    const luxonDatetime = wrapLuxonError(() =>
      LuxonDateTime.fromObject(
        { ...rest, millisecond: adjustedMillisecond } as luxon.DateObjectUnits,
        opts as luxon.DateTimeJSOptions
      )
    )

    return new DateTime(milliseconds > 0 ? luxonDatetime.plus({ milliseconds }) : luxonDatetime, microseconds)
  }

  /**
   * Create a DateTime from an ISO 8601 string.
   * @param text - ISO string (e.g. "2024-03-15T10:30:45.123456-05:00"); parses up to 6 fractional second digits
   * @param opts - Optional configuration
   * @param opts.zone - Timezone to interpret/convert the datetime in (defaults to UTC)
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns A DateTime for the parsed instant
   * @example
   * ```ts
   * DateTime.fromISO('2024-03-15T10:30:45.123456-05:00')
   * DateTime.fromISO('2024-03-15T10:30:45Z', { zone: 'America/New_York' })
   * ```
   */
  public static fromISO(text: string, opts?: DateTimeOptions): DateTime {
    const { microsecond } = parseFractionalPart(text)
    const textForLuxon = toThreeDecimalFraction(text)
    const hasTimezoneInString = hasIsoTimezoneInformation(textForLuxon)
    const luxonOpts = opts?.zone
      ? opts
      : hasTimezoneInString
        ? { setZone: true, ...opts }
        : { zone: 'UTC', ...opts }
    const luxonDatetime = wrapLuxonError(() =>
      LuxonDateTime.fromISO(textForLuxon, luxonOpts as luxon.DateTimeOptions)
    )
    return new DateTime(luxonDatetime, microsecond)
  }

  /**
   * Create a DateTime from an SQL datetime string.
   * @param text - SQL string (e.g. "2024-03-15 10:30:45.123456"); parses up to 6 fractional second digits
   * @param opts - Optional configuration
   * @param opts.zone - Timezone to interpret the datetime in (overrides timezone in string)
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns A DateTime for the parsed instant
   * @example
   * ```ts
   * DateTime.fromSQL('2024-03-15 10:30:45.123456')
   * DateTime.fromSQL('2024-03-15 10:30:45', { zone: 'America/New_York' })
   * ```
   */
  public static fromSQL(text: string, opts?: DateTimeOptions): DateTime {
    const { microsecond } = parseFractionalPart(text)
    const textForLuxon = toThreeDecimalFraction(text)
    const luxonOpts = opts?.zone ? opts : { zone: 'UTC', ...opts }
    const luxonDatetime = wrapLuxonError(() =>
      LuxonDateTime.fromSQL(textForLuxon, luxonOpts as luxon.DateTimeOptions)
    )
    return new DateTime(luxonDatetime, microsecond)
  }

  /**
   * Create a DateTime from a custom format string.
   * Supports standard Luxon format tokens plus 'u' or 'SSSSSS' for microseconds (6 decimal places).
   * @param text - The string to parse
   * @param format - Format string using Luxon tokens (e.g., 'MM/dd/yyyy HH:mm:ss.u')
   * @param opts - Optional parsing options (zone, locale, etc.)
   * @returns A DateTime for the parsed instant
   * @throws {InvalidDateTime} When the string doesn't match the format or is invalid
   * @example
   * ```ts
   * DateTime.fromFormat('12/15/2017', 'MM/dd/yyyy')
   * DateTime.fromFormat('12/15/2017 10:30:45', 'MM/dd/yyyy HH:mm:ss')
   * DateTime.fromFormat('12/15/2017 10:30:45.123456', 'MM/dd/yyyy HH:mm:ss.u')
   * DateTime.fromFormat('12/15/2017 10:30:45.123456', 'MM/dd/yyyy HH:mm:ss.SSSSSS')
   * DateTime.fromFormat('mai 25, 1982', 'MMMM dd, yyyy', { locale: 'fr' })
   * ```
   */
  public static fromFormat(text: string, format: string, opts?: DateTimeOptions): DateTime {
    const hasMicrosecondToken = format.includes('.u') || format.includes('.SSSSSS')
    const microsecond = hasMicrosecondToken ? parseFractionalPart(text).microsecond : 0
    const textForLuxon = hasMicrosecondToken ? toThreeDecimalFraction(text) : text
    const formatForLuxon = hasMicrosecondToken
      ? format.replace(/\.u\b/, '.SSS').replace(/\.SSSSSS\b/, '.SSS')
      : format

    const luxonDatetime = wrapLuxonError(() =>
      LuxonDateTime.fromFormat(textForLuxon, formatForLuxon, opts as luxon.DateTimeOptions)
    )
    return new DateTime(luxonDatetime, microsecond)
  }

  /**
   * Returns an ISO 8601 string with 6 fractional second digits (milliseconds + microseconds).
   *
   * Always converts to UTC before formatting (e.g., '2024-03-15T15:30:45.123456Z').
   *
   * @param opts - Optional format options
   * @param opts.suppressMilliseconds - If true, omits fractional seconds when they are zero
   * @param opts.suppressSeconds - If true, omits seconds when they are zero
   * @param opts.includeOffset - If true, includes timezone offset
   * @param opts.format - Format variant: 'basic' (compact) or 'extended' (default, with separators)
   * @returns ISO string (e.g. "2024-03-15T10:30:45.123456-05:00" or "2024-03-15T10:30:45.123456Z")
   * @example
   * ```ts
   * DateTime.fromISO('2024-03-15T10:30:45.123456').toISO() // Converts to UTC
   * ```
   */
  public toISO(opts?: ToISOTimeOptions): string {
    const dt = this.toUTC()
    return replaceISOMicroseconds(dt, dt.luxonDatetime.toISO(opts as luxon.ToISOTimeOptions), opts)
  }

  /**
   * Returns an ISO date string (date only, no time).
   * @returns ISO date string (e.g. "2024-03-15")
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).toISODate()
   * ```
   */
  public toISODate(): string {
    return this.luxonDatetime.toISODate()
  }

  /**
   * Returns the time portion in ISO format with 6 fractional second digits.
   *
   * Omits timezone offset by default (e.g., '10:30:45.123456').
   *
   * @param opts - Optional format options
   * @param opts.suppressMilliseconds - If true, omits fractional seconds when they are zero
   * @param opts.suppressSeconds - If true, omits seconds when they are zero
   * @param opts.includeOffset - If true, includes timezone offset
   * @param opts.format - Format variant: 'basic' (compact) or 'extended' (default, with colons)
   * @returns Time string (e.g. "10:30:45.123456" or "10:30:45.123456-05:00")
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456).toISOTime() // '10:30:45.123456'
   * ```
   */
  public toISOTime(opts?: ToISOTimeOptions): string {
    return replaceISOMicroseconds(
      this,
      this.luxonDatetime.toISOTime({
        includeOffset: false,
        ...opts,
      } as luxon.ToISOTimeOptions),
      opts
    )
  }

  /**
   * Returns an SQL datetime string with 6 fractional second digits.
   *
   * Always converts to UTC before formatting (e.g., '2024-03-15 15:30:45.123456').
   *
   * @returns SQL string (e.g. "2024-03-15 10:30:45.123456")
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456).toSQL() // Converts to UTC
   * ```
   */
  private _toSQL: string
  public toSQL(): string {
    if (this._toSQL) return this._toSQL
    const dt = this.toUTC()
    this._toSQL = replaceISOMicroseconds(dt, dt.luxonDatetime.toSQL(), {})
    return this._toSQL
  }

  /**
   * Returns an SQL date string (date only, no time).
   * @returns SQL date string (e.g. "2024-03-15")
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).toSQLDate()
   * ```
   */
  public toSQLDate(): string {
    return this.luxonDatetime.toSQLDate()
  }

  /**
   * Returns an SQL time string with 6 fractional second digits.
   *
   * Omits timezone offset by default.
   *
   * @param opts - Optional SQL time format options
   * @param opts.includeOffset - If true, includes timezone offset
   * @returns SQL time string (e.g. "10:30:45.123456")
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456).toSQLTime() // '10:30:45.123456'
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456).toSQLTime({ includeOffset: true }) // '10:30:45.123456 -04:00'
   * ```
   */
  public toSQLTime(opts: { includeOffset?: boolean } = {}): string {
    return replaceISOMicroseconds(
      this,
      this.luxonDatetime.toSQLTime({
        includeOffset: opts.includeOffset ?? false,
      } as luxon.ToSQLOptions),
      {}
    )
  }

  /**
   * Returns a JavaScript Date object.
   * @returns JavaScript Date
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).toJSDate()
   * ```
   */
  public toJSDate(): Date {
    return this.luxonDatetime.toJSDate()
  }

  /**
   * Returns an ISO 8601 string representation (for valueOf() operations).
   *
   * Converts to UTC before formatting.
   *
   * @returns ISO datetime string with microsecond precision
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).valueOf() // Converts to UTC
   * DateTime.fromISO('2026-02-07T09:03:44.123456Z').valueOf()              // '2026-02-07T09:03:44.123456Z'
   * ```
   */
  private _valueOf: string
  public valueOf(): string {
    if (this._valueOf) return this._valueOf
    this._valueOf = this.toISO()
    return this._valueOf
  }

  /**
   * Returns an ISO 8601 formatted string for JSON serialization.
   * This ensures DateTime objects are properly serialized to ISO format.
   *
   * Converts to UTC before formatting.
   *
   * @returns ISO datetime string with microsecond precision
   * @example
   * ```ts
   * DateTime.fromISO('2026-02-07T09:03:44.123456Z').toJSON()  // '2026-02-07T09:03:44.123456Z'
   * JSON.stringify({ time: DateTime.now() })  // Uses toJSON() automatically
   * ```
   */
  public toJSON(): string {
    return this.toISO()
  }

  /**
   * Returns an ISO 8601 formatted string representation.
   * Alias for toISO().
   *
   * Converts to UTC before formatting.
   *
   * @returns ISO datetime string with microsecond precision
   * @example
   * ```ts
   * DateTime.fromISO('2026-02-07T09:03:44.123456Z').toString()  // '2026-02-07T09:03:44.123456Z'
   * const dt = DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456)
   * `The time is ${dt}`  // Uses toString() implicitly
   * ```
   */
  public toString(): string {
    return this.toISO()
  }

  /**
   * Returns a localized string representation.
   * @param formatOpts - Intl.DateTimeFormat options for formatting
   * @param opts - Optional locale configuration
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns Localized string
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).toLocaleString()
   * DateTime.local(2017, 3, 12).toLocaleString(DateTime.DATE_FULL)
   * DateTime.local(2017, 3, 12).toLocaleString({ weekday: 'long' }, { locale: 'fr-FR' })
   * ```
   */
  public toLocaleString(formatOpts?: Intl.DateTimeFormatOptions, opts?: LocaleOptions): string {
    return this.luxonDatetime.toLocaleString(
      formatOpts as luxon.DateTimeFormatOptions,
      opts as luxon.LocaleOptions
    )
  }

  /**
   * Returns a string representation using a format string.
   * Supports all Luxon format tokens. Fractional second tokens (S, SSS, SSSSSS) are enhanced
   * to include microseconds beyond Luxon's millisecond precision.
   *
   * @param fmt - Format string (e.g., 'yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd HH:mm:ss.SSSSSS')
   * @param opts - Optional locale options
   * @returns Formatted string
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).toFormat('yyyy-MM-dd')  // '2017-03-12'
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456).toFormat('yyyy-MM-dd HH:mm:ss.SSSSSS')  // '2017-03-12 10:30:45.123456'
   * ```
   */
  public toFormat(fmt: string, opts?: LocaleOptions): string {
    // Check if format contains fractional second tokens (S)
    const fractionalMatch = fmt.match(/S+/)

    if (!fractionalMatch) {
      return this.luxonDatetime.toFormat(fmt, opts as luxon.LocaleOptions)
    }

    const tokenLength = fractionalMatch[0].length

    // Build the full fractional string (milliseconds + microseconds)
    const fullFractional =
      String(this.millisecond).padStart(3, '0') + String(this.microsecond).padStart(3, '0')

    // Pad or truncate to match the requested length
    const fractionalOutput = fullFractional.padEnd(tokenLength, '0').slice(0, tokenLength)

    // Replace S tokens with the literal fractional digits (escaped for Luxon)
    // We need to escape the fractional output so Luxon treats it as literal text
    const modifiedFmt = fmt.replace(/S+/, `'${fractionalOutput}'`)

    return this.luxonDatetime.toFormat(modifiedFmt, opts as luxon.LocaleOptions)
  }

  /**
   * Adds a duration to this DateTime. Supports microsecond via DurationLikeObject.
   * Fractional milliseconds are converted to microseconds (e.g., 1.5 ms = 1 ms + 500 µs).
   * @param duration - Duration to add (DurationLikeObject with microsecond, or milliseconds number)
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).plus({ hours: 2 })
   * DateTime.local(2017, 3, 12, 0, 0, 0, 0, 500).plus({ microseconds: 600 })
   * DateTime.local(2017, 3, 12).plus({ milliseconds: 1.5 }) // adds 1ms + 500µs
   * ```
   */
  public plus(duration: DurationLikeObject | number): DateTime {
    const { luxonDuration, microsecondDelta } = splitDurationAndMicroseconds(duration)
    const luxonDatetime = this.luxonDatetime.plus(luxonDuration)
    const normalized = normalizeMicrosecondTotal(this.microsecond + microsecondDelta)
    return new DateTime(
      applyMillisecondAdjustment(luxonDatetime, normalized.millisecondAdjustment),
      normalized.microseconds
    )
  }

  /**
   * Subtracts a duration from this DateTime. Supports microsecond via DurationLikeObject.
   * Fractional milliseconds are converted to microseconds (e.g., 1.5 ms = 1 ms + 500 µs).
   * @param duration - Duration to subtract
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 14).minus({ hours: 2 })
   * DateTime.local(2017, 3, 12).minus({ milliseconds: 1.5 }) // subtracts 1ms + 500µs
   * ```
   */
  public minus(duration: DurationLikeObject | number): DateTime {
    const { luxonDuration, microsecondDelta } = splitDurationAndMicroseconds(duration)
    const luxonDatetime = this.luxonDatetime.minus(luxonDuration)
    const normalized = normalizeMicrosecondTotal(this.microsecond - microsecondDelta)
    return new DateTime(
      applyMillisecondAdjustment(luxonDatetime, normalized.millisecondAdjustment),
      normalized.microseconds
    )
  }

  /**
   * Returns a new DateTime with the given units set.
   * @param values - Object with units to set (year, month, day, hour, minute, second, millisecond, microsecond)
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).set({ hour: 14, microsecond: 500 })
   * ```
   */
  public set(values: DateTimeObject): DateTime {
    const { microsecond, ...rest } = values
    const luxonDatetime = this.luxonDatetime.set(rest as luxon.DateObjectUnits)
    const { milliseconds, microseconds } = microsecondParts(microsecond ?? this.microsecond)

    return new DateTime(milliseconds > 0 ? luxonDatetime.plus({ milliseconds }) : luxonDatetime, microseconds)
  }

  /**
   * Returns an object with date/time components including microsecond.
   * @param opts - Optional options (includeConfig for Luxon config)
   * @returns Object with year, month, day, hour, minute, second, millisecond, microsecond
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 5, 45, 10, 123, 456).toObject()
   * ```
   */
  public toObject(opts?: { includeConfig?: boolean }): DateTimeObject {
    const obj = this.luxonDatetime.toObject(opts) as DateTimeObject
    return { ...obj, microsecond: this.microsecond }
  }

  /**
   * Returns true if this and other represent the same instant and microsecond.
   * @param other - DateTime to compare
   * @returns true if equal
   * @example
   * ```ts
   * dt1.equals(dt2)
   * ```
   */
  public equals(other: DateTime): boolean {
    if (!this.luxonDatetime.equals(other.luxonDatetime)) return false
    return this.microsecond === other.microsecond
  }

  /**
   * Returns the epoch time in milliseconds (toMillis * 1000 + millisecond).
   * @returns Unix timestamp in milliseconds
   * @example
   * ```ts
   * DateTime.fromMicroseconds(1770455024077750).toMillis()  // 1770455024077.75
   * ```
   */
  public toMillis(): number {
    return round(this.luxonDatetime.toMillis() + this.microsecond / 1000, 3)
  }

  /**
   * Returns the epoch time in microseconds (toMillis * 1000 + microsecond).
   * @returns Unix timestamp in microseconds
   * @example
   * ```ts
   * DateTime.fromMicroseconds(1707234567890123).toMicroseconds()  // 1707234567890123
   * ```
   */
  public toMicroseconds(): number {
    return this.luxonDatetime.toMillis() * 1000 + this.microsecond
  }

  /**
   * Returns the epoch time in seconds, including fractional milliseconds.
   * Includes microsecond precision in the fractional part.
   * @returns Unix timestamp in seconds (with fractional milliseconds)
   * @example
   * ```ts
   * DateTime.fromSeconds(1707234567).toSeconds()  // 1707234567
   * DateTime.fromISO('2026-02-07T09:03:44.123456Z').toSeconds()  // includes .123456 in fractional part
   * ```
   */
  public toSeconds(): number {
    // Get seconds from Luxon (which includes milliseconds in fractional part)
    const luxonSeconds = this.luxonDatetime.toSeconds()

    // Add microseconds to the fractional part
    // luxonSeconds already has milliseconds, so we add the additional microseconds
    const additionalMicroseconds = this.microsecond / 1_000_000

    return luxonSeconds + additionalMicroseconds
  }

  /**
   * Returns the epoch time in seconds as an integer, truncating any fractional part.
   * @example
   * ```ts
   * DateTime.fromISO('2026-02-07T09:03:44.123456Z').unixIntegerSeconds  // 1770455024
   * DateTime.fromISO('2026-02-07T09:03:44.999999Z').unixIntegerSeconds  // 1770455024 (not rounded up)
   * ```
   */
  public get unixIntegerSeconds(): number {
    return Math.floor(this.toSeconds())
  }

  /**
   * Returns the epoch time in milliseconds as an integer, truncating any fractional part.
   * @example
   * ```ts
   * DateTime.fromISO('2026-02-07T09:03:44.123456Z').unixIntegerMilliseconds  // 1770455024123
   * DateTime.fromISO('2026-02-07T09:03:44.123999Z').unixIntegerMilliseconds  // 1770455024123 (not rounded up)
   * ```
   */
  public get unixIntegerMilliseconds(): number {
    return Math.floor(this.toMillis())
  }

  /**
   * Returns the epoch time in microseconds as an integer.
   * Equivalent to `toMicroseconds()` since microseconds are always whole numbers.
   * @example
   * ```ts
   * DateTime.fromISO('2026-02-07T09:03:44.123456Z').unixIntegerMicroseconds  // 1770455024123456
   * ```
   */
  public get unixIntegerMicroseconds(): number {
    return this.toMicroseconds()
  }

  /**
   * Returns the earliest DateTime from the given arguments.
   * @param dateTimes - DateTimes to compare
   * @returns The earliest DateTime, or null if empty
   * @example
   * ```ts
   * DateTime.min(dt1, dt2, dt3)
   * ```
   */
  public static min(...dateTimes: DateTime[]): DateTime | null {
    if (dateTimes.length === 0) return null
    return dateTimes.reduce(
      (min, datetime) => (datetime.valueOf() < min.valueOf() ? datetime : min),
      dateTimes[0]!
    )
  }

  /**
   * Returns the latest DateTime from the given arguments.
   * @param dateTimes - DateTimes to compare
   * @returns The latest DateTime, or null if empty
   * @example
   * ```ts
   * DateTime.max(dt1, dt2, dt3)
   * ```
   */
  public static max(...dateTimes: DateTime[]): DateTime | null {
    if (dateTimes.length === 0) return null
    return dateTimes.reduce(
      (max, datetime) => (datetime.valueOf() > max.valueOf() ? datetime : max),
      dateTimes[0]!
    )
  }

  /**
   * Returns a new DateTime in the given zone. Microsecond is preserved.
   * @param zone - Zone name or Zone instance
   * @param opts - Optional zone options (keepLocalTime, etc.)
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).setZone('utc')
   * ```
   */
  public setZone(zone?: string | Zone, opts?: { keepLocalTime?: boolean }): DateTime {
    const luxonDatetime = this.luxonDatetime.setZone(zone as string | luxon.Zone, opts as luxon.ZoneOptions)
    return new DateTime(luxonDatetime, this.microsecond)
  }

  /**
   * Returns a new DateTime in UTC. Microsecond is preserved.
   * @param offset - Optional offset in minutes
   * @param opts - Optional zone options
   * @returns A new DateTime in UTC
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).toUTC()
   * ```
   */
  public toUTC(offset?: number, opts?: { keepLocalTime?: boolean }): DateTime {
    const luxonDatetime = this.luxonDatetime.toUTC(offset, opts as luxon.ZoneOptions)
    return new DateTime(luxonDatetime, this.microsecond)
  }

  /**
   * Returns a new DateTime in the system's local zone. Microsecond is preserved.
   * @returns A new DateTime in local zone
   * @example
   * ```ts
   * dtUTC.toLocal()
   * ```
   */
  public toLocal(): DateTime {
    return new DateTime(this.luxonDatetime.toLocal(), this.microsecond)
  }

  /**
   * Returns a new DateTime at the start of the given unit.
   * Microsecond is 0 except when unit is 'millisecond' (then preserved).
   * @param unit - Unit to truncate to (year, month, day, hour, minute, second, millisecond)
   * @param opts - Optional options
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 14, 30).startOf('day')   // 2017-03-12T00:00:00
   * DateTime.local(2017, 3, 12, 14, 30).startOf('hour')  // 2017-03-12T14:00:00
   * ```
   */
  public startOf(unit: DateTimeUnit, opts?: { useLocaleWeeks?: boolean }): DateTime {
    const luxonDatetime = this.luxonDatetime.startOf(unit as luxon.DateTimeUnit, opts)
    const microseconds = unit === 'millisecond' ? this.microsecond : 0
    return new DateTime(luxonDatetime, microseconds)
  }

  /**
   * Returns a new DateTime at the end of the given unit.
   * Microsecond is 999 when unit is 'millisecond', else 0.
   * @param unit - Unit to extend to end of
   * @param opts - Optional options
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).endOf('month')   // 2017-03-31T23:59:59.999999
   * DateTime.local(2017, 3, 12).endOf('day')    // 2017-03-12T23:59:59.999999
   * ```
   */
  public endOf(unit: DateTimeUnit, opts?: { useLocaleWeeks?: boolean }): DateTime {
    const luxonDatetime = this.luxonDatetime.endOf(unit as luxon.DateTimeUnit, opts)
    const microseconds = unit === 'millisecond' ? this.microsecond : 999
    return new DateTime(luxonDatetime, microseconds)
  }

  /**
   * Returns a new DateTime with the given locale/zone options. Microsecond is preserved.
   * @param properties - Locale and/or zone options
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).reconfigure({ locale: 'fr' })
   * ```
   */
  public reconfigure(properties: LocaleOptions): DateTime {
    const luxonDatetime = this.luxonDatetime.reconfigure(properties as luxon.LocaleOptions)
    return new DateTime(luxonDatetime, this.microsecond)
  }

  /**
   * Returns a new DateTime with the given locale. Microsecond is preserved.
   * @param locale - Locale string (e.g. 'en-US', 'fr')
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).setLocale('fr')
   * ```
   */
  public setLocale(locale: string): DateTime {
    const luxonDatetime = this.luxonDatetime.setLocale(locale)
    return new DateTime(luxonDatetime, this.microsecond)
  }

  /**
   * Returns true if this DateTime is in the same unit as another.
   * @param other - DateTime to compare
   * @param unit - Unit to compare
   * @returns true if same
   * @example
   * ```ts
   * dt1.hasSame(dt2, 'day')
   * ```
   */
  public hasSame(other: DateTime, unit: DateTimeUnit): boolean {
    return this.luxonDatetime.hasSame(other.luxonDatetime, unit as luxon.DateTimeUnit)
  }

  /**
   * Returns the difference between this and another DateTime.
   *
   * Supports microsecond precision when 'microseconds' is included in the unit parameter.
   *
   * @param other - DateTime to diff against
   * @param unit - Unit or units to return (e.g., 'days', 'hours', ['days', 'hours', 'microseconds'])
   * @returns Object with only the specified units (or all units if not specified)
   * @example
   * ```ts
   * dt1.diff(dt2, 'days') // { days: 5 }
   * dt1.diff(dt2, ['days', 'hours']) // { days: 5, hours: 3 }
   * dt1.diff(dt2, ['milliseconds', 'microseconds']) // { milliseconds: 123, microseconds: 456 }
   * dt1.diff(dt2) // { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 1, milliseconds: 500, microseconds: 0 }
   * ```
   */
  public diff<U extends DurationUnit | DurationUnit[] | undefined = undefined>(
    other: DateTime,
    unit?: U
  ): DiffResult<U> {
    const unitArray = normalizeDiffUnitArray(unit)
    let result = {} as Record<string, number>

    const onlyMicroseconds = unitArray.length === 1 && unitArray[0] === 'microseconds'

    if (!onlyMicroseconds) {
      const luxonUnitArray = normalizeDiffUnitArray(unitArray.filter(u => u !== 'microseconds'))
      const luxonDuration = this.luxonDatetime.diff(
        other.toLuxon(),
        luxonUnitArray as Exclude<DurationUnit, 'microseconds'>[]
      )
      result = luxonDuration.toObject() as Record<string, number>
    }

    const microsecondFieldDiff = this.microsecond - other.microsecond

    if (unitArray.includes('microseconds')) {
      if (onlyMicroseconds) {
        const millisecondDiff = this.luxonDatetime.diff(other.toLuxon(), 'milliseconds').milliseconds ?? 0
        result.microseconds = Math.round(millisecondDiff * 1000) + microsecondFieldDiff
      } else {
        // Find the bottom (smallest) Luxon unit in the result and convert its
        // entire value to microseconds, add the microsecond field diff, then
        // split back. This handles borrowing/carrying automatically.
        const bottomUnit = bottomLuxonUnit(result)
        if (bottomUnit !== undefined) {
          const microsPerUnit = MICROSECONDS_PER_UNIT[bottomUnit]!
          const totalMicros = Math.round(result[bottomUnit]! * microsPerUnit) + microsecondFieldDiff
          result[bottomUnit] = Math.trunc(totalMicros / microsPerUnit) || 0
          result.microseconds = totalMicros - result[bottomUnit] * microsPerUnit
        } else {
          result.microseconds = microsecondFieldDiff
        }
      }
    } else if (unitArray.includes('milliseconds')) {
      result.milliseconds = (result.milliseconds ?? 0) + microsecondFieldDiff / 1000
    }

    const filtered: Record<string, number> = {}
    for (const requestedUnit of unitArray) filtered[requestedUnit] = result[requestedUnit] ?? 0
    return filtered as DiffResult<U>
  }

  /**
   * Returns the difference between this DateTime and now.
   *
   * Supports microsecond precision when 'microseconds' is included in the unit parameter.
   *
   * @param unit - Unit or units to return
   * @returns Object with only the specified units (or all units if not specified)
   * @example
   * ```ts
   * dt.diffNow('days') // { days: 5 }
   * dt.diffNow(['days', 'hours', 'microseconds']) // { days: 5, hours: 3, microseconds: 123 }
   * ```
   */
  public diffNow<U extends DurationUnit | DurationUnit[] | undefined = undefined>(unit?: U): DiffResult<U> {
    return this.diff(DateTime.now(), unit) as DiffResult<U>
  }
}

function wrapLuxonError<T>(fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    if (error instanceof Error) throw new InvalidDateTime(error)
    throw error
  }
}

/**
 * Shared logic for local() and utc(): parses overloaded args, resolves options,
 * normalizes microsecond, and calls the appropriate Luxon factory.
 * Returns the Luxon instance and microsecond for the caller to wrap.
 * @internal
 */
function buildLocalOrUtcDateTime<T extends object>(
  yearOrOpts: number | T | undefined,
  month: number | T | undefined,
  day: number | T | undefined,
  hour: number | T | undefined,
  minute: number | T | undefined,
  second: number | T | undefined,
  millisecond: number | T | undefined,
  microsecondOrOpts: number | T | undefined,
  opts: T | undefined,
  isOpts: (v: unknown) => v is T,
  factory: (
    y: number,
    m: number,
    d: number,
    h: number,
    mi: number,
    s: number,
    ms: number,
    opts?: T
  ) => LuxonDateTime
): { luxonDatetime: LuxonDateTime; microseconds: number } {
  const options = firstOptionArg(
    isOpts,
    opts,
    microsecondOrOpts,
    millisecond,
    second,
    minute,
    hour,
    day,
    month,
    yearOrOpts
  )

  const { milliseconds: millisecondPartOfMicroseconds, microseconds } = microsecondParts(
    typeof microsecondOrOpts === 'number' ? microsecondOrOpts : 0
  )

  const y = numericOrDefault(yearOrOpts, 0)
  const m = numericOrDefault(month, 1)
  const d = numericOrDefault(day, 1)
  const ms = numericOrDefault(millisecond, 0) + millisecondPartOfMicroseconds
  const luxonDatetime = factory(
    y,
    m,
    d,
    numericOrDefault(hour, 0),
    numericOrDefault(minute, 0),
    numericOrDefault(second, 0),
    ms,
    options
  )
  return { luxonDatetime, microseconds }
}

function splitDurationAndMicroseconds(duration: DurationLikeObject | number): {
  luxonDuration: luxon.DurationLikeObject
  microsecondDelta: number
} {
  const durationObj: DurationLikeObject = typeof duration === 'number' ? { milliseconds: duration } : duration
  const { microsecond = 0, microseconds = 0, millisecond, milliseconds, ...rest } = durationObj

  const luxonDuration = { ...rest } as Record<string, number>
  const millisecondInput = milliseconds ?? millisecond
  let microsecondDelta = microsecond + microseconds

  if (millisecondInput !== undefined) {
    const wholeMilliseconds = Math.floor(millisecondInput)
    const fractionalMilliseconds = millisecondInput - wholeMilliseconds
    microsecondDelta += Math.round(fractionalMilliseconds * 1000)

    if (milliseconds !== undefined) {
      luxonDuration.milliseconds = wholeMilliseconds
    } else {
      luxonDuration.millisecond = wholeMilliseconds
    }
  }

  return { luxonDuration: luxonDuration as luxon.DurationLikeObject, microsecondDelta }
}

function normalizeMicrosecondTotal(totalMicroseconds: number): {
  millisecondAdjustment: number
  microseconds: number
} {
  const millisecondAdjustment = Math.floor(totalMicroseconds / 1000)
  const microseconds = ((totalMicroseconds % 1000) + 1000) % 1000
  return { millisecondAdjustment, microseconds }
}

function applyMillisecondAdjustment(datetime: LuxonDateTime, milliseconds: number): LuxonDateTime {
  return milliseconds !== 0 ? datetime.plus({ milliseconds }) : datetime
}

function normalizeDiffUnitArray<U extends DurationUnit | DurationUnit[] | undefined>(
  unit: U
): DurationUnit[] {
  if (unit === undefined) return DEFAULT_DIFF_UNITS_WITH_MICROSECONDS
  return typeof unit === 'string' ? [unit] : unit.length === 0 ? DEFAULT_DIFF_UNITS_WITH_MICROSECONDS : unit
}

const DEFAULT_DIFF_UNITS_WITH_MICROSECONDS: DurationUnit[] = [
  'years',
  'months',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
] as const

/** Microseconds per Luxon unit, ordered from smallest to largest unit. */
const MICROSECONDS_PER_UNIT: Record<string, number> = {
  milliseconds: 1_000,
  seconds: 1_000_000,
  minutes: 60_000_000,
  hours: 3_600_000_000,
  days: 86_400_000_000,
  weeks: 604_800_000_000,
}

/** Returns the smallest Luxon unit present in the result object (excluding microseconds). */
function bottomLuxonUnit(result: Record<string, number>): string | undefined {
  for (const unit of Object.keys(MICROSECONDS_PER_UNIT)) {
    if (result[unit] !== undefined) return unit
  }
  return undefined
}

function numericOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback
}

function firstOptionArg<T extends object>(
  isOpts: (value: unknown) => value is T,
  ...values: Array<number | T | undefined>
): T | undefined {
  for (const value of values) {
    if (isOpts(value)) return value
  }
  return undefined
}

/** Parse fractional part from ISO/SQL string: first 3 digits = ms, next 3 = µs */
function parseFractionalPart(str: string): { millisecond: number; microsecond: number } {
  const match = str.match(/\.(\d+)/)
  if (!match) return { millisecond: 0, microsecond: 0 }
  const frac = (match[1] ?? '').padEnd(6, '0').slice(0, 6)
  return {
    millisecond: parseInt(frac.slice(0, 3), 10),
    microsecond: parseInt(frac.slice(3, 6), 10),
  }
}

/** Reduce ISO/SQL string to 3 decimal places for Luxon (ms only) */
function toThreeDecimalFraction(str: string): string {
  const match = str.match(/\.(\d+)/)
  if (!match) return str
  const frac = (match[1] ?? '').padEnd(3, '0').slice(0, 3)
  return str.replace(/\.\d+/, '.' + frac)
}

const ISO_TIMEZONE_SUFFIX_REGEX = /(Z|[+-]\d{2}(?::?\d{2})?)$/i

function hasIsoTimezoneInformation(str: string): boolean {
  return ISO_TIMEZONE_SUFFIX_REGEX.test(str)
}

/**
 * Thrown when a DateTime is invalid (e.g. invalid input or Luxon error).
 * @param error - The original error (available as cause)
 * @example
 * ```ts
 * try {
 *   DateTime.fromISO('invalid')
 * } catch (e) {
 *   if (e instanceof InvalidDateTime) console.error(e.cause)
 * }
 * ```
 */
export class InvalidDateTime extends Error {
  public constructor(error: Error) {
    super(error.message ?? '')
    this.name = 'InvalidDateTime'
    this.cause = error
  }
}
