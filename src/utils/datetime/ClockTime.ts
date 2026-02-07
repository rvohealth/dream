import { type ClockTimeObject } from '../../types/clocktime.js'
import { type LocaleOptions } from '../../types/datetime.js'
import BaseClockTime from './BaseClockTime.js'
import { BASE_DATE_OBJECT, DateTime } from './DateTime.js'

/**
 * ClockTime represents a time of day without timezone information.
 *
 * Useful for representing TIME WITHOUT TIME ZONE fields from a Postgres database.
 * All output methods strip timezone offset information.
 */
export default class ClockTime extends BaseClockTime {
  /**
   * Create a ClockTime from a JavaScript Date.
   * @param javascriptDate - A JavaScript Date instance
   * @returns A ClockTime for the time portion
   * @example
   * ```ts
   * ClockTime.fromJSDate(new Date())
   * ```
   */
  public static fromJSDate(javascriptDate: Date): ClockTime {
    const dateTime = this.wrapLuxonError(() => DateTime.fromJSDate(javascriptDate))
    return new ClockTime(dateTime)
  }

  /**
   * Create a ClockTime from an ISO 8601 time string.
   * Preserves the time values as-is, regardless of any timezone info in the string.
   * @param str - ISO time string (e.g., '14:30:45.123456')
   * @returns A ClockTime for the given time
   * @throws {InvalidClockTime} When the ISO string is invalid
   * @example
   * ```ts
   * ClockTime.fromISO('14:30:45.123456')      // stores 14:30:45.123456
   * ClockTime.fromISO('14:30:45.123456-05:00') // stores 14:30:45.123456 (timezone ignored)
   * ```
   */
  public static fromISO(str: string): ClockTime {
    const dateTime = this.wrapLuxonError(() => DateTime.fromISO(str))
    return new ClockTime(dateTime)
  }

  /**
   * Create a ClockTime from an SQL time string.
   * Preserves the time values as-is, regardless of any timezone info in the string.
   * @param str - SQL time string (e.g., '14:30:45.123456')
   * @returns A ClockTime for the given time
   * @throws {InvalidClockTime} When the SQL string is invalid
   * @example
   * ```ts
   * ClockTime.fromSQL('14:30:45.123456')       // stores 14:30:45.123456
   * ClockTime.fromSQL('14:30:45.123456+05:30') // stores 14:30:45.123456 (timezone ignored)
   * ```
   */
  public static fromSQL(str: string): ClockTime {
    const dateTime = this.wrapLuxonError(() => DateTime.fromSQL(str))
    return new ClockTime(dateTime)
  }

  /**
   * Create a ClockTime from a custom format string.
   * Uses Luxon format tokens (e.g., 'HH:mm:ss', 'hh:mm a').
   * @param text - The string to parse
   * @param format - Format string using Luxon tokens
   * @param opts - Optional configuration
   * @param opts.locale - Locale for parsing (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Output calendar system (e.g., 'islamic', 'hebrew')
   * @returns A ClockTime for the parsed time
   * @throws {InvalidClockTime} When the string doesn't match the format or is invalid
   * @example
   * ```ts
   * ClockTime.fromFormat('14:30:45', 'HH:mm:ss')
   * ClockTime.fromFormat('2:30 PM', 'h:mm a')
   * ```
   */
  public static fromFormat(text: string, format: string, opts?: LocaleOptions): ClockTime {
    const dateTime = this.wrapLuxonError(() => DateTime.fromFormat(text, format, opts))
    return new ClockTime(dateTime)
  }

  /**
   * Create a ClockTime from an object with time units.
   * @param obj - Object with hour, minute, second, millisecond, microsecond properties
   * @param opts - Optional configuration
   * @param opts.locale - Locale (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Output calendar system (e.g., 'islamic', 'hebrew')
   * @returns A ClockTime for the given components
   * @throws {InvalidClockTime} When time values are invalid
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30, second: 45 })
   * ClockTime.fromObject({ hour: 14, minute: 30 })
   * ```
   */
  public static fromObject(obj: Partial<ClockTimeObject>, opts?: LocaleOptions): ClockTime {
    const dateTime = this.wrapLuxonError(() =>
      DateTime.fromObject(
        {
          ...BASE_DATE_OBJECT,
          ...obj,
        },
        opts
      )
    )
    return new ClockTime(dateTime)
  }

  /**
   * Returns a ClockTime for the current time.
   * @returns A ClockTime for now
   * @example
   * ```ts
   * ClockTime.now()
   * ```
   */
  public static now(): ClockTime {
    return new ClockTime(DateTime.now())
  }

  /**
   * Returns the time as an ISO 8601 time string without timezone offset.
   * Alias for `toISOTime()`.
   *
   * @param opts - Optional format options
   * @param opts.suppressMilliseconds - If true, omits milliseconds/microseconds when they are zero
   * @param opts.suppressSeconds - If true, omits seconds when they are zero
   * @param opts.format - Format variant: 'basic' (compact) or 'extended' (default, with colons)
   * @returns ISO time string without timezone offset (e.g., '14:30:45.123456')
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30, second: 45 }).toISO()  // '14:30:45.000000'
   * ClockTime.fromISO('14:30:45-05:00').toISO()  // '14:30:45.000000' (timezone stripped)
   * ```
   */
  public override toISO(opts?: {
    suppressMilliseconds?: boolean
    suppressSeconds?: boolean
    format?: 'basic' | 'extended'
  }): string {
    return this.dateTime.toISOTime({ ...opts, includeOffset: false })
  }

  /**
   * Returns the SQL time string without timezone offset.
   * Result is memoized for performance.
   *
   * @returns SQL time string without timezone offset (e.g., '14:30:45.123456')
   * @example
   * ```ts
   * ClockTime.fromISO('14:30:45').toSQL()  // '14:30:45.000000'
   * ```
   */
  public override toSQL(): string {
    if (this._toSQL) return this._toSQL
    this._toSQL = this.dateTime.toSQLTime({ includeOffset: false })
    return this._toSQL
  }

  protected static override wrapLuxonError<T>(fn: () => T): T {
    try {
      return fn()
    } catch (error) {
      if (error instanceof Error) throw new InvalidClockTime(error)
      throw error
    }
  }

  protected override wrapLuxonError<T>(fn: () => T): T {
    return (this.constructor as typeof ClockTime).wrapLuxonError(fn)
  }
}

/**
 * Thrown when a ClockTime is invalid (e.g., invalid input or time values).
 * @param error - The original error (available as cause)
 * @example
 * ```ts
 * try {
 *   ClockTime.fromISO('25:00:00')
 * } catch (e) {
 *   if (e instanceof InvalidClockTime) console.error(e.message)
 * }
 * ```
 */
export class InvalidClockTime extends Error {
  constructor(error: Error) {
    super((error.message ?? '').replace('DateTime', 'ClockTime'))
  }
}
