import { type ClockTimeObject } from '../../types/clocktime.js'
import { type DateTimeJSOptions, type DateTimeOptions, type Zone } from '../../types/datetime.js'
import BaseClockTime from './BaseClockTime.js'
import { DateTime } from './DateTime.js'

/**
 * ClockTimeTz represents a time of day with timezone information.
 *
 * Useful for representing TIME WITH TIME ZONE fields from a Postgres database.
 * All output methods include timezone offset information.
 */
export default class ClockTimeTz extends BaseClockTime {
  /**
   * Create a ClockTimeTz from a JavaScript Date.
   * @param javascriptDate - A JavaScript Date instance
   * @param options - Optional configuration
   * @param options.zone - Timezone to interpret the date in (IANA timezone name or Zone object)
   * @returns A ClockTimeTz for the time portion
   * @example
   * ```ts
   * ClockTimeTz.fromJSDate(new Date())
   * ClockTimeTz.fromJSDate(new Date(), { zone: 'America/New_York' })
   * ```
   */
  public static fromJSDate(javascriptDate: Date, opts: { zone?: string | Zone } = {}): ClockTimeTz {
    const dateTime = this.wrapLuxonError(() => DateTime.fromJSDate(javascriptDate, opts))
    return new ClockTimeTz(dateTime)
  }

  /**
   * Create a ClockTimeTz from an ISO 8601 time string.
   * If the string includes timezone information, it will be used.
   * If no timezone is in the string, it will be interpreted as UTC.
   * @param str - ISO time string (e.g., '14:30:45.123456-05:00')
   * @param options - Optional configuration
   * @param options.zone - Timezone to interpret the time in (overrides timezone in string)
   * @returns A ClockTimeTz for the given time
   * @throws {InvalidClockTimeTz} When the ISO string is invalid
   * @example
   * ```ts
   * ClockTimeTz.fromISO('14:30:45.123456')        // Interpreted as UTC
   * ClockTimeTz.fromISO('14:30:45.123456-05:00')  // Uses timezone from string
   * ```
   */
  public static fromISO(str: string, opts: { zone?: string | Zone } = {}): ClockTimeTz {
    const dateTime = this.wrapLuxonError(() => DateTime.fromISO(str, opts))
    return new ClockTimeTz(dateTime)
  }

  /**
   * Create a ClockTimeTz from an SQL time string.
   * If no zone option is provided, the time will be interpreted as UTC.
   * @param str - SQL time string (e.g., '14:30:45.123456')
   * @param options - Optional configuration
   * @param options.zone - Timezone to interpret the time in (overrides timezone in string)
   * @returns A ClockTimeTz for the given time
   * @throws {InvalidClockTimeTz} When the SQL string is invalid
   * @example
   * ```ts
   * ClockTimeTz.fromSQL('14:30:45.123456')                    // Interpreted as UTC
   * ClockTimeTz.fromSQL('14:30:45.123456+05:30')              // Uses timezone from string
   * ClockTimeTz.fromSQL('14:30:45', { zone: 'America/Chicago' })  // Uses specified zone
   * ```
   */
  public static fromSQL(str: string, opts: { zone?: string | Zone } = {}): ClockTimeTz {
    const dateTime = this.wrapLuxonError(() => DateTime.fromSQL(str, opts))
    return new ClockTimeTz(dateTime)
  }

  /**
   * Create a ClockTimeTz from a custom format string.
   * Uses Luxon format tokens (e.g., 'HH:mm:ss', 'hh:mm a').
   * @param text - The string to parse
   * @param format - Format string using Luxon tokens
   * @param opts - Optional configuration
   * @param opts.zone - Timezone to interpret the time in (IANA timezone name or Zone object)
   * @param opts.locale - Locale for parsing (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Output calendar system (e.g., 'islamic', 'hebrew')
   * @returns A ClockTimeTz for the parsed time
   * @throws {InvalidClockTimeTz} When the string doesn't match the format or is invalid
   * @example
   * ```ts
   * ClockTimeTz.fromFormat('14:30:45', 'HH:mm:ss')
   * ClockTimeTz.fromFormat('2:30 PM', 'h:mm a')
   * ClockTimeTz.fromFormat('14:30:45 -05:00', 'HH:mm:ss ZZ')
   * ```
   */
  public static fromFormat(text: string, format: string, opts?: DateTimeOptions): ClockTimeTz {
    const dateTime = this.wrapLuxonError(() => DateTime.fromFormat(text, format, opts))
    return new ClockTimeTz(dateTime)
  }

  /**
   * Create a ClockTimeTz from an object with time units.
   * @param obj - Object with hour, minute, second, millisecond, microsecond properties
   * @param opts - Optional configuration
   * @param opts.zone - Timezone for the time (IANA timezone name or Zone object, defaults to UTC)
   * @param opts.locale - Locale (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Output calendar system (e.g., 'islamic', 'hebrew')
   * @returns A ClockTimeTz for the given components
   * @throws {InvalidClockTimeTz} When time values are invalid
   * @example
   * ```ts
   * ClockTimeTz.fromObject({ hour: 14, minute: 30, second: 45 })  // UTC by default
   *
   * // Note for when sending a named, non-UTC time zone, soch as 'America/New_York':
   * // Sending a non-UTC time zone will interpret the time zone based on DateTime.now,
   * // meaning the resulting ClockTimeTz will have a different time and offset when
   * // generated during daylight savings time than not during daylight savings time
   * ClockTimeTz.fromObject({ hour: 14, minute: 30 }, { zone: 'America/New_York' })
   * ```
   */
  public static fromObject(obj: Partial<ClockTimeObject>, opts?: DateTimeJSOptions): ClockTimeTz {
    // for ClockTimeTz, we set the date to now because the time in a timezone, like 'America/New_York'
    // is dependent on the date
    const nowObject = DateTime.now(opts?.zone ? { zone: opts.zone } : undefined).toObject()
    const dateTime = this.wrapLuxonError(() =>
      DateTime.fromObject(
        {
          year: nowObject.year,
          month: nowObject.month,
          day: nowObject.day,
          ...obj,
        },
        opts
      )
    )
    return new ClockTimeTz(dateTime)
  }

  /**
   * Returns the time as an ISO 8601 time string with timezone offset.
   * Alias for `toISOTime()`.
   *
   * @param opts - Optional format options
   * @param opts.suppressMilliseconds - If true, omits milliseconds/microseconds when they are zero
   * @param opts.suppressSeconds - If true, omits seconds when they are zero
   * @param opts.format - Format variant: 'basic' (compact) or 'extended' (default, with colons)
   * @returns ISO time string with timezone offset (e.g., '14:30:45.123456-05:00')
   * @example
   * ```ts
   * ClockTimeTz.fromObject({ hour: 14, minute: 30, second: 45 }).toISO()  // '14:30:45.000000+00:00'
   * ClockTimeTz.fromISO('14:30:45-05:00').toISO()  // '14:30:45.000000-05:00'
   * ```
   */
  public override toISO(opts?: {
    suppressMilliseconds?: boolean
    suppressSeconds?: boolean
    format?: 'basic' | 'extended'
  }): string {
    return this.dateTime.toISOTime({ ...opts, includeOffset: true })
  }

  /**
   * Returns the SQL time string with timezone offset.
   * Result is memoized for performance.
   *
   * @returns SQL time string with timezone offset (e.g., '14:30:45.123456 -05:00')
   * @example
   * ```ts
   * ClockTimeTz.fromISO('14:30:45-05:00').toSQL()  // '14:30:45.000000 -05:00'
   * ```
   */
  public override toSQL(): string {
    if (this._toSQL) return this._toSQL
    this._toSQL = this.dateTime.toSQLTime({ includeOffset: true })
    return this._toSQL
  }

  /**
   * Gets the timezone name.
   * @returns The timezone name
   * @example
   * ```ts
   * ClockTimeTz.fromObject({ hour: 14 }, { zone: 'America/New_York' }).zoneName
   * ```
   */
  public get zoneName(): string {
    return this.dateTime.zoneName
  }

  /**
   * Gets the timezone offset in minutes.
   * @returns The offset in minutes
   * @example
   * ```ts
   * ClockTimeTz.fromISO('14:30:45-05:00').offset  // -300
   * ```
   */
  public get offset(): number {
    return this.dateTime.offset
  }

  /**
   * Returns a ClockTime for the current time.
   * @returns A ClockTime for now
   * @example
   * ```ts
   * ClockTime.now()
   * ```
   */
  public static now(opts?: { zone?: string | Zone }): ClockTimeTz {
    return new ClockTimeTz(DateTime.now(opts))
  }

  /**
   * Returns a new ClockTimeTz with the timezone changed.
   * The time value changes to reflect the same instant in the new timezone.
   * @param zone - The timezone to convert to
   * @returns A new ClockTimeTz in the specified timezone
   * @example
   * ```ts
   * const utc = ClockTimeTz.fromObject({ hour: 14, minute: 30 }, { zone: 'UTC' })
   * const ny = utc.setZone('America/New_York')
   * // Time is converted to New York timezone (e.g., 09:30 EST)
   * ```
   */
  public setZone(zone: string | Zone): ClockTimeTz {
    return new ClockTimeTz(this.dateTime.setZone(zone))
  }

  protected static override wrapLuxonError<T>(fn: () => T): T {
    try {
      return fn()
    } catch (error) {
      if (error instanceof Error) throw new InvalidClockTimeTz(error)
      throw error
    }
  }

  protected override wrapLuxonError<T>(fn: () => T): T {
    return (this.constructor as typeof ClockTimeTz).wrapLuxonError(fn)
  }
}

/**
 * Thrown when a ClockTimeTz is invalid (e.g., invalid input or time values).
 * @param error - The original error (available as cause)
 * @example
 * ```ts
 * try {
 *   ClockTimeTz.fromISO('25:00:00')
 * } catch (e) {
 *   if (e instanceof InvalidClockTimeTz) console.error(e.message)
 * }
 * ```
 */
export class InvalidClockTimeTz extends Error {
  constructor(error: Error) {
    super((error.message ?? '').replace('DateTime', 'ClockTimeTz'))
  }
}
