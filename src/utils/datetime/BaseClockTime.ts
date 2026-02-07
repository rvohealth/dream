import {
  ClockTimeDiffResult,
  ClockTimeDurationLikeObject,
  ClockTimeDurationUnit,
  ClockTimeUnit,
  type ClockTimeObject,
} from '../../types/clocktime.js'
import { type LocaleOptions } from '../../types/datetime.js'
import { DateTime } from './DateTime.js'

export default class BaseClockTime {
  protected dateTime: DateTime
  protected _toSQL?: string

  /**
   * @internal
   */
  public constructor(source?: DateTime | null) {
    if (source instanceof DateTime) {
      this.dateTime = source
    } else {
      this.dateTime = DateTime.now()
    }
  }

  /**
   * Create a ClockTimeTz from a DateTime instance.
   * @param dateTime - A DateTime instance
   * @returns A ClockTimeTz for the time portion of the DateTime
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromDateTime(DateTime.now())
   * ```
   */
  public static fromDateTime<T extends typeof BaseClockTime>(this: T, dateTime: DateTime): InstanceType<T> {
    return new (this as typeof BaseClockTime)(dateTime) as InstanceType<T>
  }

  /**
   * Returns true if this ClockTime equals another ClockTime.
   * @param otherClockTime - ClockTime to compare
   * @returns true if times are equal
   * @example
   * ```ts
   * const t1 = ClockTime.fromObject({ hour: 14, minute: 30 })
   * const t2 = ClockTime.fromObject({ hour: 14, minute: 30 })
   * t1.equals(t2)  // true
   * ```
   */
  public equals<T extends BaseClockTime>(this: T, otherClockTime: T): boolean {
    return this.valueOf() === otherClockTime.valueOf()
  }

  /**
   * Returns a new ClockTime with the given time units set.
   * @param values - Object with time units to set (hour, minute, second, millisecond, microsecond)
   * @returns A new ClockTime
   * @throws {InvalidClockTime} When the underlying DateTime operation fails
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 10, minute: 30 }).set({ hour: 14, microsecond: 500 })
   * // hour: 14, minute: 30, microsecond: 500
   * ```
   */
  public set<T extends BaseClockTime>(this: T, values: Partial<ClockTimeObject>): T {
    return new (this.constructor as typeof BaseClockTime)(
      this.wrapLuxonError(() => this.dateTime.set(values))
    ) as T
  }

  /**
   * Returns a new ClockTime at the start of the given period.
   * @param period - Unit to truncate to ('hour', 'minute', or 'second')
   * @returns A ClockTime at the start of the period
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30, second: 45 }).startOf('hour')
   * // hour: 14, minute: 0, second: 0
   * ```
   */
  public startOf<T extends BaseClockTime>(this: T, period: ClockTimeUnit): T {
    return new (this.constructor as typeof BaseClockTime)(this.dateTime.startOf(period)) as T
  }

  /**
   * Returns a new ClockTime at the end of the given period.
   * @param period - Unit to extend to end of ('hour', 'minute', or 'second')
   * @returns A ClockTime at the end of the period
   * @example
   * ```ts
   * ClockTime.fromObject({ hour: 14, minute: 30 }).endOf('hour')
   * // hour: 14, minute: 59, second: 59, millisecond: 999
   * ```
   */
  public endOf<T extends BaseClockTime>(this: T, period: ClockTimeUnit): T {
    return new (this.constructor as typeof BaseClockTime)(this.dateTime.endOf(period)) as T
  }

  /**
   * Returns the time as an ISO time string (for valueOf() operations).
   * @returns ISO time string
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.now().valueOf()
   * ```
   */
  private _valueOf: string
  public valueOf(): string {
    if (this._valueOf) return this._valueOf
    this._valueOf = this.toISOTime()
    return this._valueOf
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public toISO(opts?: {
    suppressMilliseconds?: boolean
    suppressSeconds?: boolean
    format?: 'basic' | 'extended'
  }): string {
    throw new Error('override toISO in extending class')
  }

  public toSQL(): string {
    throw new Error('override toSQL in extending class')
  }

  /**
   * Returns the time as an ISO 8601 time string with timezone offset.
   * Alias for `toISO()`.
   *
   * @param opts - Optional format options
   * @param opts.suppressMilliseconds - If true, omits milliseconds/microseconds when they are zero
   * @param opts.suppressSeconds - If true, omits seconds when they are zero
   * @param opts.format - Format variant: 'basic' (compact) or 'extended' (default, with colons)
   * @returns ISO time string with timezone offset (e.g., '14:30:45.123456-05:00')
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromObject({ hour: 14, minute: 30, second: 45 }).toISOTime()  // '14:30:45.000000+00:00'
   * ClockTime/ClockTimeTz.fromISO('14:30:45-05:00').toISOTime()  // '14:30:45.000000-05:00'
   * ```
   */
  public toISOTime(opts?: {
    suppressMilliseconds?: boolean
    suppressSeconds?: boolean
    format?: 'basic' | 'extended'
  }): string {
    return this.toISO(opts)
  }

  /**
   * Returns the time as an ISO time string for JSON serialization.
   * @returns ISO time string
   * @example
   * ```ts
   * JSON.stringify({ time: ClockTime.now() })
   * ```
   */
  public toJSON() {
    return this.toISOTime()
  }

  /**
   * Alias of `toSQL`.
   * Returns the SQL time string without timezone offset.
   * Result is memoized for performance.
   *
   * @returns SQL time string without timezone offset (e.g., '14:30:45.123456')
   */
  public toSQLTime(): string {
    return this.toSQL()
  }

  /**
   * Returns a localized string representation of the time.
   * @param formatOpts - Intl.DateTimeFormat options for formatting
   * @param opts - Optional locale configuration
   * @param opts.locale - Locale string (e.g., 'en-US', 'fr-FR')
   * @param opts.numberingSystem - Numbering system (e.g., 'arab', 'beng')
   * @param opts.outputCalendar - Calendar system (e.g., 'islamic', 'hebrew')
   * @returns Localized time string
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.now().toLocaleString()
   * ClockTime/ClockTimeTz.now().toLocaleString({ hour: 'numeric', minute: '2-digit' })
   * ClockTime/ClockTimeTz.now().toLocaleString({ hour: '2-digit' }, { locale: 'fr-FR' })
   * ```
   */
  public toLocaleString(formatOpts?: Intl.DateTimeFormatOptions, opts?: LocaleOptions): string {
    return this.dateTime.toLocaleString(formatOpts, opts)
  }

  /**
   * Returns the time as an ISO string (same as toISO).
   * @returns ISO datetime string
   * @example
   * ```ts
   * ClockTime.now().toString()
   * ```
   */
  public toString() {
    return this.toISO()
  }

  /**
   * Returns the underlying DateTime instance.
   * @returns A DateTime representing this time with zone
   * @example
   * ```ts
   * const dt = ClockTime/ClockTimeTz.now().toDateTime()
   * ```
   */
  public toDateTime(): DateTime {
    return this.dateTime
  }

  /**
   * Gets the hour (0-23).
   * @returns The hour number
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromObject({ hour: 14, minute: 30 }).hour  // 14
   * ```
   */
  public get hour(): number {
    return this.dateTime.hour
  }

  /**
   * Gets the minute (0-59).
   * @returns The minute number
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromObject({ hour: 14, minute: 30 }).minute  // 30
   * ```
   */
  public get minute(): number {
    return this.dateTime.minute
  }

  /**
   * Gets the second (0-59).
   * @returns The second number
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromObject({ hour: 14, minute: 30, second: 45 }).second  // 45
   * ```
   */
  public get second(): number {
    return this.dateTime.second
  }

  /**
   * Gets the millisecond (0-999).
   * @returns The millisecond number
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromObject({ hour: 14, minute: 30, millisecond: 123 }).millisecond  // 123
   * ```
   */
  public get millisecond(): number {
    return this.dateTime.millisecond
  }

  /**
   * Gets the microsecond (0-999).
   * @returns The microsecond number
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromISO('14:30:45.123456').microsecond  // 456
   * ```
   */
  public get microsecond(): number {
    return this.dateTime.microsecond
  }

  /**
   * Returns the earliest ClockTime/ClockTimeTz from the given arguments.
   * @param clockTimes - ClockTime/ClockTimeTz instances to compare
   * @returns The earliest ClockTime/ClockTimeTz
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.min(time1, time2, time3)
   * ```
   */
  public static min<T extends typeof BaseClockTime>(
    this: T,
    ...clockTimes: InstanceType<T>[]
  ): InstanceType<T> | null {
    if (clockTimes.length === 0) return null
    return clockTimes.reduce((min, time) => (time.valueOf() < min.valueOf() ? time : min), clockTimes[0]!)
  }

  /**
   * Returns the latest ClockTime/ClockTimeTz from the given arguments.
   * @param clockTimes - ClockTime/ClockTimeTz instances to compare
   * @returns The latest ClockTime/ClockTimeTz
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.max(time1, time2, time3)
   * ```
   */
  public static max<T extends typeof BaseClockTime>(
    this: T,
    ...clockTimes: InstanceType<T>[]
  ): InstanceType<T> | null {
    if (clockTimes.length === 0) return null
    return clockTimes.reduce((max, time) => (time.valueOf() > max.valueOf() ? time : max), clockTimes[0]!)
  }

  /**
   * Returns a new ClockTime/ClockTimeTz with the given duration added.
   * @param duration - Duration to add (object with hours, minutes, seconds, etc.)
   * @returns A new ClockTime/ClockTimeTz
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromObject({ hour: 14, minute: 30 }).plus({ hours: 2, minutes: 15 })
   * // hour: 16, minute: 45
   * ```
   */
  public plus<T extends BaseClockTime>(this: T, duration: ClockTimeDurationLikeObject): T {
    return new (this.constructor as typeof BaseClockTime)(this.dateTime.plus(duration)) as T
  }

  /**
   * Returns a new ClockTime/ClockTimeTz with the given duration subtracted.
   * @param duration - Duration to subtract (object with hours, minutes, seconds, etc.)
   * @returns A new ClockTime/ClockTimeTz
   * @example
   * ```ts
   * ClockTime/ClockTimeTz.fromObject({ hour: 14, minute: 30 }).minus({ hours: 2, minutes: 15 })
   * // hour: 12, minute: 15
   * ```
   */
  public minus<T extends BaseClockTime>(this: T, duration: ClockTimeDurationLikeObject): T {
    return new (this.constructor as typeof BaseClockTime)(this.dateTime.minus(duration)) as T
  }

  /**
   * Returns true if this and other are in the same unit of time.
   * @param otherClockTime - ClockTime to compare against
   * @param period - Unit to check ('hour', 'minute', or 'second')
   * @returns true if same period
   * @example
   * ```ts
   * const t1 = ClockTime.fromObject({ hour: 14, minute: 30 })
   * const t2 = ClockTime.fromObject({ hour: 14, minute: 45 })
   * t1.hasSame(t2, 'hour')    // true
   * t1.hasSame(t2, 'minute')  // false
   * ```
   */
  public hasSame<T extends BaseClockTime>(this: T, otherClockTime: T, period: ClockTimeUnit): boolean {
    const otherDateTime = otherClockTime.toDateTime()
    if (otherDateTime === null) return false
    return this.dateTime.hasSame(otherDateTime, period)
  }

  /**
   * Returns the difference between this ClockTime and another in the specified unit.
   * @param otherClockTime - ClockTime to compare against
   * @param duration - Unit for the difference ('hours', 'minutes', 'seconds', etc.)
   * @returns Numeric difference in the specified unit
   * @example
   * ```ts
   * const t1 = ClockTime.fromObject({ hour: 14, minute: 30 })
   * const t2 = ClockTime.fromObject({ hour: 10, minute: 15 })
   * t1.diff(t2, 'hours')    // 4.25
   * t1.diff(t2, 'minutes')  // 255
   * ```
   */
  /**
   * Returns the difference between this ClockTime and another in the specified unit(s).
   * Supports microsecond precision when 'microseconds' is included in the unit parameter.
   *
   * @param other - ClockTime to compare against
   * @param unit - Unit or units to return (hours, minutes, seconds, milliseconds, microseconds)
   * @returns Object with only the specified units (or all units if not specified)
   * @example
   * ```ts
   * const t1 = ClockTime.fromObject({ hour: 15, minute: 30 })
   * const t2 = ClockTime.fromObject({ hour: 14, minute: 0 })
   * t1.diff(t2, 'hours')  // { hours: 1 }
   * t1.diff(t2, ['hours', 'minutes'])  // { hours: 1, minutes: 30 }
   * t1.diff(t2)  // { hours: 1, minutes: 30, seconds: 0, milliseconds: 0, microseconds: 0 }
   * ```
   */
  public diff<
    T extends BaseClockTime,
    U extends ClockTimeDurationUnit | ClockTimeDurationUnit[] | undefined = undefined,
  >(this: T, other: T, unit?: U): ClockTimeDiffResult<U> {
    const otherDateTime = other.toDateTime()
    const unitArray = unit === undefined ? undefined : Array.isArray(unit) ? unit : [unit]
    const result = this.dateTime.diff(otherDateTime, unitArray as any) as Record<string, number>
    const filtered: Record<string, number> = {}

    const requestedUnits: ClockTimeDurationUnit[] =
      unit === undefined
        ? ['hours', 'minutes', 'seconds', 'milliseconds', 'microseconds']
        : Array.isArray(unit)
          ? unit
          : [unit]

    for (const requestedUnit of requestedUnits) {
      filtered[requestedUnit] = result[requestedUnit] ?? 0
    }

    return filtered as ClockTimeDiffResult<U>
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected static wrapLuxonError<T>(fn: () => T): T {
    throw new Error('override wrapLuxonError static method in extending class')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected wrapLuxonError<T>(fn: () => T): T {
    throw new Error('override wrapLuxonError instance method in extending class')
  }
}
