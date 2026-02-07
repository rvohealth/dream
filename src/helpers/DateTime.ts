import type {
  DateObjectUnits,
  DateTimeJSOptions,
  DateTimeOptions,
  DateTimeUnit,
  LocaleOptions,
  ToISOTimeOptions,
  ToSQLOptions,
} from 'luxon'
import * as luxon from 'luxon'
import { DateTime as LuxonDateTime } from 'luxon'
import replaceISOMicroseconds from '../../spec/unit/helpers/dateAndTime/replaceISOMicroseconds.js'
import { Duration, type DurationLike, InvalidDuration } from './Duration.js'

export const Settings = luxon.Settings
Settings.throwOnInvalid = true

const MICROSECONDS_MIN = 0

/**
 * Normalizes a microsecond value: values > 999 become whole milliseconds + remainder (0–999).
 * Throws for negative.
 */
export function microsecondParts(microsecondInput: number): {
  milliseconds: number
  microseconds: number
} {
  if (microsecondInput < MICROSECONDS_MIN) {
    throw new InvalidDateTime(
      new Error(`microsecond must be a non-negative integer, got: ${String(microsecondInput)}`)
    )
  }

  const totalMicroseconds = Math.round(microsecondInput)
  const milliseconds = Math.floor(totalMicroseconds / 1000)

  return {
    milliseconds,
    microseconds: totalMicroseconds - milliseconds * 1000,
  }
}

/**
 * DateTime extends Luxon DateTime with microsecond precision (0-999).
 * The decimal part in ISO/SQL is 6 digits: first 3 = milliseconds, next 3 = microseconds.
 */
// @ts-expect-error TS2345 - Luxon DateTime constructor is private; we extend for microsecond support
export class DateTime extends LuxonDateTime {
  protected readonly _microseconds: number

  /**
   * Microsecond part of the Datetime (NOT microseconds since Unix epoch)
   *
   * This value will not exceed 999 because above that will carry over to the
   * millisecond part of the DateTime
   *
   * @returns The microsecond of the second (0–999)
   */
  public get microsecond(): number {
    return this._microseconds
  }

  protected constructor(config: LuxonDateTimeConfig, microseconds: number = 0) {
    super(config)
    this._microseconds = microseconds
  }

  /**
   * Wraps a Luxon DateTime with our DateTime, attaching the given microsecond component.
   * @internal
   * @param luxonDatetime - The Luxon DateTime instance
   * @param microseconds - Microsecond component (0–999)
   * @returns A DateTime wrapping the Luxon instance with microsecond support
   */
  private static wrap(luxonDatetime: LuxonDateTime, microseconds: number): DateTime {
    const config = configFromLuxon(luxonDatetime)
    return new DateTime(config, microseconds)
  }

  /**
   * Returns the current time in the system's local zone.
   * @returns A DateTime for the current instant
   * @example
   * ```ts
   * const now = DateTime.now()
   * ```
   */
  public static override now(): DateTime {
    return DateTime.wrap(LuxonDateTime.now(), 0)
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
   * @param opts - Options (zone, locale, etc.)
   * @returns A DateTime in the local zone
   * @example
   * ```ts
   * DateTime.local()                                    // now
   * DateTime.local(2017, 3, 12)                         // 2017-03-12T00:00:00
   * DateTime.local(2017, 3, 12, 5, 45, 10, 765, 123)    // with microsecond
   * DateTime.local(2017, 3, 12, { zone: 'utc' })        // with options
   * ```
   */
  // Overloads: full set of Luxon local() signatures plus microsecond as 8th numeric arg
  public static override local(
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
  static override local(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    opts?: DateTimeJSOptions
  ): DateTime
  public static override local(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    opts?: DateTimeJSOptions
  ): DateTime
  public static override local(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    opts?: DateTimeJSOptions
  ): DateTime
  public static override local(
    year: number,
    month: number,
    day: number,
    hour: number,
    opts?: DateTimeJSOptions
  ): DateTime
  public static override local(year: number, month: number, day: number, opts?: DateTimeJSOptions): DateTime
  public static override local(year: number, month: number, opts?: DateTimeJSOptions): DateTime
  public static override local(year: number, opts?: DateTimeJSOptions): DateTime
  public static override local(opts?: DateTimeJSOptions): DateTime
  public static override local(
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
    const isOpts = (v: unknown): v is DateTimeJSOptions =>
      typeof v === 'object' && v !== null && !('toMillis' in v)
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
      (y, m, d, h, mi, s, ms, options) => LuxonDateTime.local(y, m, d, h, mi, s, ms, options)
    )
    return DateTime.wrap(luxonDatetime, microseconds)
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
   * @param options - Options (locale, etc.)
   * @returns A DateTime in UTC
   * @example
   * ```ts
   * DateTime.utc()                                      // now in UTC
   * DateTime.utc(2017, 3, 12, 5, 45, 10, 765, 123)     // with microsecond
   * DateTime.utc(2017, 3, 12, { locale: 'fr' })        // with options
   * ```
   */
  // Overloads: full set of Luxon utc() signatures plus microsecond as 8th numeric arg
  public static override utc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    microsecond: number,
    options?: LocaleOptions
  ): DateTime
  public static override utc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    options?: LocaleOptions
  ): DateTime
  public static override utc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    options?: LocaleOptions
  ): DateTime
  public static override utc(
    year: number,
    month: number,
    day: number,
    hour: number,
    options?: LocaleOptions
  ): DateTime
  public static override utc(year: number, month: number, day: number, options?: LocaleOptions): DateTime
  public static override utc(year: number, month: number, options?: LocaleOptions): DateTime
  public static override utc(year: number, options?: LocaleOptions): DateTime
  public static override utc(options?: LocaleOptions): DateTime
  public static override utc(
    yearOrOpts?: number | LocaleOptions,
    month?: number | LocaleOptions,
    day?: number | LocaleOptions,
    hour?: number | LocaleOptions,
    minute?: number | LocaleOptions,
    second?: number | LocaleOptions,
    millisecond?: number | LocaleOptions,
    microsecondOrOpts?: number | LocaleOptions,
    options?: LocaleOptions
  ): DateTime {
    const isOpts = (v: unknown): v is LocaleOptions =>
      typeof v === 'object' && v !== null && !('toMillis' in v)
    const { luxonDatetime, microseconds } = buildLocalOrUtcDateTime(
      yearOrOpts,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecondOrOpts,
      options,
      isOpts,
      (y, m, d, h, mi, s, ms, opts) => LuxonDateTime.utc(y, m, d, h, mi, s, ms, opts)
    )
    return DateTime.wrap(luxonDatetime, microseconds)
  }

  /**
   * Create a DateTime from a JavaScript Date.
   * @param date - A JavaScript Date instance
   * @param options - Optional zone for the result
   * @returns A DateTime representing the same instant
   * @example
   * ```ts
   * DateTime.fromJSDate(new Date())
   * DateTime.fromJSDate(new Date(), { zone: 'America/New_York' })
   * ```
   */
  public static override fromJSDate(date: Date, options?: { zone?: string | luxon.Zone }): DateTime {
    const luxonDatetime = LuxonDateTime.fromJSDate(date, options)
    return DateTime.wrap(luxonDatetime, 0)
  }

  /**
   * Create a DateTime from epoch milliseconds.
   * @param milliseconds - Unix timestamp in milliseconds
   * @param options - Optional zone/locale options
   * @returns A DateTime for the given instant
   * @example
   * ```ts
   * DateTime.fromMillis(1707234567890)
   * ```
   */
  public static override fromMillis(milliseconds: number, options?: DateTimeJSOptions): DateTime {
    const luxonDatetime = LuxonDateTime.fromMillis(milliseconds, options)
    return DateTime.wrap(luxonDatetime, 0)
  }

  /**
   * Create a DateTime from epoch microseconds.
   * @param microseconds - Unix timestamp in microseconds (milliseconds from quotient, microsecond from remainder)
   * @param options - Optional zone/locale options
   * @returns A DateTime for the given instant
   * @example
   * ```ts
   * DateTime.fromMicroseconds(1707234567890123)
   * ```
   */
  public static fromMicroseconds(microseconds: number, options?: DateTimeJSOptions): DateTime {
    const milliseconds = Math.floor(microseconds / 1000)
    const luxonDatetime = LuxonDateTime.fromMillis(milliseconds, options)
    return DateTime.wrap(luxonDatetime, microseconds - milliseconds * 1000)
  }

  /**
   * Create a DateTime from epoch seconds.
   * @param seconds - Unix timestamp in seconds
   * @param options - Optional zone/locale options
   * @returns A DateTime for the given instant
   * @example
   * ```ts
   * DateTime.fromSeconds(1707234567)
   * ```
   */
  public static override fromSeconds(seconds: number, options?: DateTimeJSOptions): DateTime {
    const luxonDatetime = LuxonDateTime.fromSeconds(seconds, options)
    return DateTime.wrap(luxonDatetime, 0)
  }

  /**
   * Create a DateTime from an object with date/time units.
   * @param obj - Object with year, month, day, etc.; supports optional microsecond
   * @param opts - Optional zone/locale options
   * @returns A DateTime for the given components
   * @example
   * ```ts
   * DateTime.fromObject({ year: 2017, month: 3, day: 12, hour: 5, minute: 45, microsecond: 123 })
   * ```
   */
  public static override fromObject(
    obj: DateObjectUnits & { microsecond?: number },
    opts?: DateTimeJSOptions
  ): DateTime {
    const { microsecond, ...rest } = obj
    const { milliseconds, microseconds } = microsecondParts(microsecond ?? 0)
    const luxonDatetime = wrapLuxonError(() => LuxonDateTime.fromObject(rest, opts))

    return DateTime.wrap(
      milliseconds > 0 ? luxonDatetime.plus({ milliseconds }) : luxonDatetime,
      microseconds
    )
  }

  /**
   * Create a DateTime from an ISO 8601 string.
   * @param text - ISO string (e.g. "2024-03-15T10:30:45.123456-05:00"); parses up to 6 fractional second digits
   * @param opts - Optional parsing options
   * @returns A DateTime for the parsed instant
   * @example
   * ```ts
   * DateTime.fromISO('2024-03-15T10:30:45.123456-05:00')
   * ```
   */
  public static override fromISO(text: string, opts?: DateTimeOptions): DateTime {
    const { microsecond } = parseFractionalPart(text)
    const textForLuxon = toThreeDecimalFraction(text)
    const luxonDatetime = wrapLuxonError(() => LuxonDateTime.fromISO(textForLuxon, opts))
    return DateTime.wrap(luxonDatetime, microsecond)
  }

  /**
   * Create a DateTime from an SQL datetime string.
   * @param text - SQL string (e.g. "2024-03-15 10:30:45.123456"); parses up to 6 fractional second digits
   * @param opts - Optional parsing options
   * @returns A DateTime for the parsed instant
   * @example
   * ```ts
   * DateTime.fromSQL('2024-03-15 10:30:45.123456')
   * ```
   */
  public static override fromSQL(text: string, opts?: DateTimeOptions): DateTime {
    const { microsecond } = parseFractionalPart(text)
    const textForLuxon = toThreeDecimalFraction(text)
    const luxonDatetime = wrapLuxonError(() => LuxonDateTime.fromSQL(textForLuxon, opts))
    return DateTime.wrap(luxonDatetime, microsecond)
  }

  /**
   * Returns an ISO 8601 string with 6 fractional second digits (milliseconds + microseconds).
   * @param opts - Optional format options (includeOffset, suppressMilliseconds, etc.)
   * @returns ISO string (e.g. "2024-03-15T10:30:45.123456-05:00")
   * @example
   * ```ts
   * DateTime.fromISO('2024-03-15T10:30:45.123456').toISO()
   * ```
   */
  public override toISO(opts?: ToISOTimeOptions): string {
    return replaceISOMicroseconds(this, super.toISO(opts), opts)
  }

  /**
   * Returns the time portion in ISO format with 6 fractional second digits.
   * @param opts - Optional format options
   * @returns Time string (e.g. "10:30:45.123456-05:00")
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456).toISOTime()
   * ```
   */
  public override toISOTime(opts?: ToISOTimeOptions): string {
    return replaceISOMicroseconds(this, super.toISOTime(opts), opts)
  }

  /**
   * Returns an SQL datetime string with 6 fractional second digits.
   * @param opts - Optional format options
   * @returns SQL string (e.g. "2024-03-15 10:30:45.123456")
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456).toSQL()
   * ```
   */
  public override toSQL(opts?: ToSQLOptions): string {
    const base = super.toSQL(opts)
    const frac = `${String(this.millisecond).padStart(3, '0')}${String(this.microsecond).padStart(3, '0')}`
    return base.replace(/\.\d{3}/, '.' + frac)
  }

  /**
   * Returns an SQL time string with 6 fractional second digits.
   * @param opts - Optional format options
   * @returns SQL time string (e.g. "10:30:45.123456")
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 10, 30, 45, 123, 456).toSQLTime()
   * ```
   */
  public override toSQLTime(opts?: ToSQLOptions): string {
    const base = super.toSQLTime(opts)
    const frac = `${String(this.millisecond).padStart(3, '0')}${String(this.microsecond).padStart(3, '0')}`
    return base.replace(/\.\d{3}/, '.' + frac)
  }

  /**
   * Adds a duration to this DateTime. Supports microsecond via Duration or DurationLikeObject.
   * @param duration - Duration to add (Duration, DurationLikeObject with microsecond, or milliseconds number)
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12).plus({ hours: 2 })
   * DateTime.local(2017, 3, 12, 0, 0, 0, 0, 500).plus(Duration.fromMicroseconds(600))
   * ```
   */
  // @ts-expect-error TS2416 - we extend the signature to accept microseconds in duration; return type DateTime
  public override plus(duration: DurationLike): DateTime {
    let durationToAdd: Duration

    try {
      durationToAdd = Duration.fromDurationLike(duration)
    } catch (error) {
      if (error instanceof InvalidDuration) throw new InvalidDateTime(error)
      throw error
    }

    const luxonDatetime = super.plus(durationToAdd) as LuxonDateTime
    const { milliseconds, microseconds } = microsecondParts(this.microsecond + durationToAdd.microseconds)

    return DateTime.wrap(
      milliseconds > 0 ? luxonDatetime.plus({ milliseconds }) : luxonDatetime,
      microseconds
    )
  }

  /**
   * Subtracts a duration from this DateTime. Supports microsecond via Duration or DurationLikeObject.
   * @param duration - Duration to subtract
   * @returns A new DateTime
   * @example
   * ```ts
   * DateTime.local(2017, 3, 12, 14).minus({ hours: 2 })
   * ```
   */
  // @ts-expect-error TS2416 - we extend the signature to accept microseconds in duration; return type DateTime
  public override minus(duration: DurationLike): DateTime {
    let durationToSubtract: Duration

    try {
      durationToSubtract = Duration.fromDurationLike(duration)
    } catch (error) {
      if (error instanceof InvalidDuration) throw new InvalidDateTime(error)
      throw error
    }

    return this.plus(Duration.fromMicroseconds(-durationToSubtract.toMicroseconds()))
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
  // @ts-expect-error TS2416 - we extend the signature to accept microsecond
  public override set(values: DateObjectUnits & { microsecond?: number }): DateTime {
    const { microsecond, ...rest } = values
    const luxonDatetime = super.set(rest) as LuxonDateTime
    const { milliseconds, microseconds } = microsecondParts(microsecond ?? this.microsecond)

    return DateTime.wrap(
      milliseconds > 0 ? luxonDatetime.plus({ milliseconds }) : luxonDatetime,
      microseconds
    )
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
  public override toObject<IncludeConfig extends boolean | undefined = undefined>(opts?: {
    includeConfig?: IncludeConfig
  }): ReturnType<LuxonDateTime['toObject']> & { microsecond: number } {
    const obj = super.toObject(opts) as ReturnType<LuxonDateTime['toObject']> & { microsecond?: number }
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
  public override equals(other: DateTime): boolean {
    if (!super.equals(other as LuxonDateTime)) return false
    return this.microsecond === other.microsecond
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
    return this.toMillis() * 1000 + this.microsecond
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
  public static override min(...dateTimes: DateTime[]): DateTime | null {
    if (dateTimes.length === 0) return null
    return dateTimes.reduce(
      (best, dt) => (dt.toMicroseconds() < best.toMicroseconds() ? dt : best),
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
  public static override max(...dateTimes: DateTime[]): DateTime | null {
    if (dateTimes.length === 0) return null
    return dateTimes.reduce(
      (best, dt) => (dt.toMicroseconds() > best.toMicroseconds() ? dt : best),
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
  public override setZone(zone?: string | luxon.Zone, opts?: luxon.ZoneOptions): DateTime {
    const luxonDatetime = super.setZone(zone, opts)
    return DateTime.wrap(luxonDatetime as LuxonDateTime, this.microsecond)
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
  // @ts-expect-error TS2416 - return type DateTime not assignable to base this
  public override toUTC(offset?: number, opts?: luxon.ZoneOptions): DateTime {
    const luxonDatetime = super.toUTC(offset, opts)
    return DateTime.wrap(luxonDatetime as LuxonDateTime, this.microsecond)
  }

  /**
   * Returns a new DateTime in the system's local zone. Microsecond is preserved.
   * @returns A new DateTime in local zone
   * @example
   * ```ts
   * dtUTC.toLocal()
   * ```
   */
  // @ts-expect-error TS2416 - return type DateTime not assignable to base this
  public override toLocal(): DateTime {
    const luxonDatetime = super.toLocal()
    return DateTime.wrap(luxonDatetime as LuxonDateTime, this.microsecond)
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
  // @ts-expect-error TS2416 - return type DateTime not assignable to base this
  public override startOf(unit: DateTimeUnit, opts?: luxon.StartOfOptions): DateTime {
    const luxonDatetime = super.startOf(unit, opts)
    const microseconds = unit === 'millisecond' ? this.microsecond : 0
    return DateTime.wrap(luxonDatetime as LuxonDateTime, microseconds)
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
  // @ts-expect-error TS2416 - return type DateTime not assignable to base this
  public override endOf(unit: DateTimeUnit, opts?: luxon.EndOfOptions): DateTime {
    const luxonDatetime = super.endOf(unit, opts)
    const microseconds = unit === 'millisecond' ? this.microsecond : 999
    return DateTime.wrap(luxonDatetime as LuxonDateTime, microseconds)
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
  // @ts-expect-error TS2416 - return type DateTime not assignable to base this
  public override reconfigure(properties: LocaleOptions): DateTime {
    const luxonDatetime = super.reconfigure(properties)
    return DateTime.wrap(luxonDatetime as LuxonDateTime, this.microsecond)
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
  // @ts-expect-error TS2416 - return type DateTime not assignable to base this
  public override setLocale(locale: string): DateTime {
    const luxonDatetime = super.setLocale(locale)
    return DateTime.wrap(luxonDatetime as LuxonDateTime, this.microsecond)
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
 * Config type passed to Luxon's private DateTime constructor.
 * ConstructorParameters<typeof LuxonDateTime> cannot be used because the constructor is private.
 */
interface LuxonDateTimeConfig {
  ts: number
  zone: luxon.Zone
  c: unknown
  o: number
  loc: unknown
  invalid: unknown
  old: Omit<LuxonDateTimeConfig, 'old'>
}

function configFromLuxon(inst: LuxonDateTime): LuxonDateTimeConfig {
  const src = inst as unknown as LuxonDateTimeConfig
  const current: Omit<LuxonDateTimeConfig, 'old'> = {
    ts: src.ts,
    zone: src.zone,
    c: src.c,
    o: src.o,
    loc: src.loc,
    invalid: src.invalid,
  }
  return { ...current, old: current }
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
    options?: T
  ) => LuxonDateTime
): { luxonDatetime: LuxonDateTime; microseconds: number } {
  const options: T | undefined = isOpts(opts)
    ? opts
    : isOpts(microsecondOrOpts)
      ? microsecondOrOpts
      : isOpts(millisecond)
        ? millisecond
        : isOpts(second)
          ? second
          : isOpts(minute)
            ? minute
            : isOpts(hour)
              ? hour
              : isOpts(day)
                ? day
                : isOpts(month)
                  ? month
                  : isOpts(yearOrOpts)
                    ? yearOrOpts
                    : undefined

  const { milliseconds: millisecondPartOfMicroseconds, microseconds } = microsecondParts(
    typeof microsecondOrOpts === 'number' ? microsecondOrOpts : 0
  )

  const y = typeof yearOrOpts === 'number' ? yearOrOpts : 0
  const m = typeof month === 'number' ? month : 1
  const d = typeof day === 'number' ? day : 1
  const ms = (typeof millisecond === 'number' ? millisecond : 0) + millisecondPartOfMicroseconds
  const luxonDatetime = factory(
    y,
    m,
    d,
    typeof hour === 'number' ? hour : 0,
    typeof minute === 'number' ? minute : 0,
    typeof second === 'number' ? second : 0,
    ms,
    options
  )
  return { luxonDatetime, microseconds }
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
